<?php

namespace App\Services;

use App\Models\PayrollStatutoryConfig;

class KenyaPayrollCalculator
{
    /**
     * Perform complete Kenyan Statutory & Gross-to-Net Payroll Computation.
     */
    public static function calculate(
        float $basicSalary,
        array $allowances = [],
        array $customDeductions = [],
        ?PayrollStatutoryConfig $config = null
    ): array {
        // 1. Calculate Gross Salary
        $totalAllowances = 0.00;
        foreach ($allowances as $a) {
            $totalAllowances += (float)($a['amount'] ?? 0);
        }
        $grossSalary = round($basicSalary + $totalAllowances, 2);

        // Fallback default config if not passed
        if (!$config) {
            $config = new PayrollStatutoryConfig([
                'nssf_enabled'         => true,
                'nssf_rate'            => 6.00,
                'nssf_tier1_limit'     => 8000.00,
                'nssf_tier2_limit'     => 72000.00,
                'shif_enabled'         => true,
                'shif_rate'            => 2.75,
                'shif_min_amount'      => 300.00,
                'housing_levy_enabled' => true,
                'housing_levy_rate'    => 1.50,
                'paye_enabled'         => true,
                'paye_brackets'        => [
                    ['limit' => 24000.00, 'rate' => 10.00],
                    ['limit' => 8333.33, 'rate' => 25.00],
                    ['limit' => 467666.67, 'rate' => 30.00],
                    ['limit' => 300000.00, 'rate' => 32.50],
                    ['limit' => null, 'rate' => 35.00],
                ],
                'personal_relief'      => 2400.00,
                'shif_relief_rate'     => 15.00,
                'shif_relief_max'      => 5000.00,
                'housing_relief_rate'  => 15.00,
                'housing_relief_max'   => 9000.00,
            ]);
        }

        // 2. NSSF Computation (Tier I & Tier II)
        $nssfTier1 = 0.00;
        $nssfTier2 = 0.00;
        $totalNssf = 0.00;

        if ($config->nssf_enabled && $grossSalary > 0) {
            $rate = ($config->nssf_rate ?? 6.00) / 100;
            $tier1Limit = $config->nssf_tier1_limit ?? 8000.00;
            $tier2Limit = $config->nssf_tier2_limit ?? 72000.00;

            // Tier 1
            $tier1Pensionable = min($grossSalary, $tier1Limit);
            $nssfTier1 = round($tier1Pensionable * $rate, 2);

            // Tier 2
            if ($grossSalary > $tier1Limit) {
                $tier2Pensionable = min($grossSalary - $tier1Limit, $tier2Limit - $tier1Limit);
                $nssfTier2 = round($tier2Pensionable * $rate, 2);
            }

            $totalNssf = round($nssfTier1 + $nssfTier2, 2);
        }

        // 3. SHIF Computation (Social Health Insurance Fund)
        $shifAmount = 0.00;
        if ($config->shif_enabled && $grossSalary > 0) {
            $shifRate = ($config->shif_rate ?? 2.75) / 100;
            $shifMin = $config->shif_min_amount ?? 300.00;
            $calculatedShif = round($grossSalary * $shifRate, 2);
            $shifAmount = max($shifMin, $calculatedShif);
        }

        // 4. Affordable Housing Levy (AHL)
        $housingLevy = 0.00;
        if ($config->housing_levy_enabled && $grossSalary > 0) {
            $housingRate = ($config->housing_levy_rate ?? 1.50) / 100;
            $housingLevy = round($grossSalary * $housingRate, 2);
        }

        // 5. Taxable Pay Calculation (Gross minus allowable NSSF)
        $taxablePay = max(0, round($grossSalary - $totalNssf, 2));

        // 6. PAYE Tax Brackets Computation
        $grossPaye = 0.00;
        if ($config->paye_enabled && $taxablePay > 0) {
            $remainingTaxable = $taxablePay;
            $brackets = $config->paye_brackets ?? [];

            foreach ($brackets as $b) {
                $bLimit = $b['limit'] ?? null;
                $bRate = ($b['rate'] ?? 0) / 100;

                if ($bLimit === null || $bLimit <= 0) {
                    // Highest tax bracket (above last threshold)
                    $grossPaye += round($remainingTaxable * $bRate, 2);
                    $remainingTaxable = 0;
                    break;
                }

                $taxableInBand = min($remainingTaxable, (float)$bLimit);
                $grossPaye += round($taxableInBand * $bRate, 2);
                $remainingTaxable -= $taxableInBand;

                if ($remainingTaxable <= 0) {
                    break;
                }
            }
        }

        // 7. Statutory Reliefs Calculation
        $personalRelief = $config->personal_relief ?? 2400.00;
        $shifRelief = 0.00;
        if ($config->shif_relief_rate > 0 && $shifAmount > 0) {
            $shifRelief = min(
                round($shifAmount * ($config->shif_relief_rate / 100), 2),
                $config->shif_relief_max ?? 5000.00
            );
        }

        $housingRelief = 0.00;
        if ($config->housing_relief_rate > 0 && $housingLevy > 0) {
            $housingRelief = min(
                round($housingLevy * ($config->housing_relief_rate / 100), 2),
                $config->housing_relief_max ?? 9000.00
            );
        }

        $totalReliefs = round($personalRelief + $shifRelief + $housingRelief, 2);

        // 8. Net PAYE
        $netPaye = max(0, round($grossPaye - $totalReliefs, 2));

        // 9. Itemized Deductions Snapshot
        $deductionsSnapshot = [];
        if ($totalNssf > 0) {
            $deductionsSnapshot[] = [
                'label'   => 'NSSF Contribution (Tier I & II)',
                'amount'  => $totalNssf,
                'type'    => 'statutory',
                'code'    => 'NSSF',
                'details' => ['tier1' => $nssfTier1, 'tier2' => $nssfTier2],
            ];
        }
        if ($shifAmount > 0) {
            $deductionsSnapshot[] = [
                'label'   => 'Social Health Insurance (SHIF)',
                'amount'  => $shifAmount,
                'type'    => 'statutory',
                'code'    => 'SHIF',
            ];
        }
        if ($housingLevy > 0) {
            $deductionsSnapshot[] = [
                'label'   => 'Affordable Housing Levy (AHL)',
                'amount'  => $housingLevy,
                'type'    => 'statutory',
                'code'    => 'AHL',
            ];
        }
        if ($netPaye > 0 || $grossPaye > 0) {
            $deductionsSnapshot[] = [
                'label'      => 'KRA PAYE (Income Tax)',
                'amount'     => $netPaye,
                'type'       => 'statutory',
                'code'       => 'PAYE',
                'gross_tax'  => $grossPaye,
                'reliefs'    => $totalReliefs,
            ];
        }

        // Add custom deductions (Sacco, Loans, Advances)
        $totalCustomDeductions = 0.00;
        foreach ($customDeductions as $cd) {
            $amt = (float)($cd['amount'] ?? 0);
            if ($amt > 0) {
                $totalCustomDeductions += $amt;
                $deductionsSnapshot[] = [
                    'label'  => $cd['label'] ?? 'Other Deduction',
                    'amount' => $amt,
                    'type'   => 'custom',
                ];
            }
        }

        $totalStatutory = round($totalNssf + $shifAmount + $housingLevy + $netPaye, 2);
        $totalDeductions = round($totalStatutory + $totalCustomDeductions, 2);
        $netSalary = max(0, round($grossSalary - $totalDeductions, 2));

        return [
            'basic_salary'            => $basicSalary,
            'total_allowances'        => $totalAllowances,
            'gross_salary'            => $grossSalary,
            'nssf_tier1'              => $nssfTier1,
            'nssf_tier2'              => $nssfTier2,
            'total_nssf'              => $totalNssf,
            'shif_amount'             => $shifAmount,
            'housing_levy'            => $housingLevy,
            'taxable_pay'             => $taxablePay,
            'gross_paye'              => $grossPaye,
            'personal_relief'         => $personalRelief,
            'shif_relief'             => $shifRelief,
            'housing_relief'          => $housingRelief,
            'total_reliefs'           => $totalReliefs,
            'net_paye'                => $netPaye,
            'total_statutory'         => $totalStatutory,
            'total_custom_deductions' => $totalCustomDeductions,
            'total_deductions'        => $totalDeductions,
            'net_salary'              => $netSalary,
            'allowances_snapshot'     => $allowances,
            'deductions_snapshot'     => $deductionsSnapshot,
        ];
    }
}