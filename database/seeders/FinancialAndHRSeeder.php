<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\School;

class FinancialAndHRSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $schools = [
            'greenfield' => School::withoutGlobalScopes()->where('slug', 'greenfield-academy')->first(),
            'staustin'   => School::withoutGlobalScopes()->where('slug', 'st-austin-high')->first(),
            'premier'    => School::withoutGlobalScopes()->where('slug', 'nairobi-premier')->first(),
        ];

        foreach ($schools as $key => $school) {
            if (!$school) continue;

            $this->command->info("Seeding Finance & HR/Payroll for: {$school->name}");

            $academicYear = DB::table('academic_years')
                ->where('school_id', $school->id)
                ->where('is_current', 1)
                ->first();
            $academicYearId = $academicYear ? $academicYear->id : null;

            // ----------------------------------------------------
            // 1. HR: SALARY STRUCTURES & PAYROLLS
            // ----------------------------------------------------
            $staffMembers = DB::table('staff')->where('school_id', $school->id)->get();

            foreach ($staffMembers as $staff) {
                $basicSalary = (float) $staff->salary;
                $houseAllowance = round($basicSalary * 0.15, 2);
                $commuterAllowance = 5000.00;
                $totalAllowances = $houseAllowance + $commuterAllowance;

                $nssf = 1080.00;
                $nhif = 1700.00;
                $paye = round($basicSalary * 0.12, 2);
                $totalDeductions = $nssf + $nhif + $paye;

                $netSalary = $basicSalary + $totalAllowances - $totalDeductions;

                $allowancesJson = json_encode([
                    ['name' => 'House Allowance', 'amount' => $houseAllowance],
                    ['name' => 'Commuter Allowance', 'amount' => $commuterAllowance],
                ]);

                $deductionsJson = json_encode([
                    ['name' => 'PAYE', 'amount' => $paye],
                    ['name' => 'NSSF', 'amount' => $nssf],
                    ['name' => 'NHIF / SHA', 'amount' => $nhif],
                ]);

                DB::table('salary_structures')->updateOrInsert(
                    ['school_id' => $school->id, 'staff_id' => $staff->id],
                    [
                        'basic_salary' => $basicSalary,
                        'allowances'   => $allowancesJson,
                        'deductions'   => $deductionsJson,
                        'is_active'    => 1,
                        'created_at'   => $now,
                        'updated_at'   => $now,
                    ]
                );

                // Generated Payroll for current month
                $monthYear = Carbon::now()->format('Y-m');
                DB::table('payrolls')->updateOrInsert(
                    ['school_id' => $school->id, 'staff_id' => $staff->id, 'month_year' => $monthYear],
                    [
                        'basic_salary'        => $basicSalary,
                        'total_allowances'    => $totalAllowances,
                        'total_deductions'    => $totalDeductions,
                        'net_salary'          => $netSalary,
                        'working_days'        => 26,
                        'present_days'        => 26,
                        'leave_days'          => 0,
                        'allowances_snapshot' => $allowancesJson,
                        'deductions_snapshot' => $deductionsJson,
                        'status'              => 'paid',
                        'paid_on'             => Carbon::now()->subDays(2)->toDateString(),
                        'note'                => "Monthly salary disburstment for {$monthYear}",
                        'created_at'          => $now,
                        'updated_at'          => $now,
                    ]
                );
            }

            // ----------------------------------------------------
            // 2. FEE CATEGORIES
            // ----------------------------------------------------
            $categories = [
                ['name' => 'Tuition Fee', 'type' => 'tuition', 'desc' => 'Core instruction and academic materials'],
                ['name' => 'Transport Service', 'type' => 'transport', 'desc' => 'School bus pickup and dropoff'],
                ['name' => 'Library & E-Resources', 'type' => 'library', 'desc' => 'Library catalog and digital resources'],
                ['name' => 'Examination & CBC Assessment', 'type' => 'exam', 'desc' => 'Assessment printing and KNEC evaluation'],
                ['name' => 'Activity & Sports Levy', 'type' => 'sports', 'desc' => 'Co-curricular sports, talent hub and tournaments'],
            ];

            $seededCategories = [];
            foreach ($categories as $cat) {
                DB::table('fee_categories')->updateOrInsert(
                    ['school_id' => $school->id, 'name' => $cat['name']],
                    [
                        'description' => $cat['desc'],
                        'type'        => $cat['type'],
                        'is_active'   => 1,
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]
                );

                $seededCategories[$cat['type']] = DB::table('fee_categories')
                    ->where('school_id', $school->id)
                    ->where('name', $cat['name'])
                    ->first()->id;
            }

            // ----------------------------------------------------
            // 3. FEE STRUCTURES PER CLASS
            // ----------------------------------------------------
            $classes = DB::table('classes')->where('school_id', $school->id)->get();
            $seededStructures = [];

            foreach ($classes as $cls) {
                $feeAmount = match ($key) {
                    'greenfield' => 38500.00,
                    'staustin'   => 65000.00,
                    'premier'    => 85000.00,
                    default      => 40000.00,
                };

                DB::table('fee_structures')->updateOrInsert(
                    [
                        'school_id'       => $school->id,
                        'class_id'        => $cls->id,
                        'fee_category_id' => $seededCategories['tuition'],
                    ],
                    [
                        'academic_year' => '2026',
                        'amount'        => $feeAmount,
                        'due_date'      => '2026-01-31',
                        'frequency'     => 'monthly',
                        'description'   => "Term 1 Tuition and Facilities for {$cls->name}",
                        'is_active'     => 1,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]
                );

                $struct = DB::table('fee_structures')
                    ->where('school_id', $school->id)
                    ->where('class_id', $cls->id)
                    ->where('fee_category_id', $seededCategories['tuition'])
                    ->first();

                $seededStructures[$cls->id] = $struct;
            }

            // ----------------------------------------------------
            // 4. STUDENT INVOICES, PAYMENTS & LEDGER
            // ----------------------------------------------------
            $students = DB::table('students')->where('school_id', $school->id)->get();

            foreach ($students as $idx => $student) {
                $struct = $seededStructures[$student->class_id] ?? null;
                if (!$struct) continue;

                $totalAmount = (float) $struct->amount;
                
                // Varied payment profiles for testing
                $paymentProfile = match ($idx % 3) {
                    0 => ['paid' => $totalAmount, 'status' => 'paid'],
                    1 => ['paid' => round($totalAmount * 0.6, 2), 'status' => 'partial'],
                    2 => ['paid' => 0.00, 'status' => 'unpaid'],
                };

                $paidAmount = $paymentProfile['paid'];
                $balance = $totalAmount - $paidAmount;
                $invNumber = 'INV-' . strtoupper(substr($key, 0, 2)) . '-' . (202600 + $student->id);

                DB::table('fee_invoices')->updateOrInsert(
                    ['school_id' => $school->id, 'invoice_number' => $invNumber],
                    [
                        'student_id'       => $student->id,
                        'academic_year_id' => $academicYearId,
                        'class_id'         => $student->class_id,
                        'fee_structure_id' => $struct->id,
                        'term'             => 'Term 1',
                        'issue_date'       => '2026-01-06',
                        'due_date'         => '2026-01-31',
                        'total_amount'     => $totalAmount,
                        'paid_amount'      => $paidAmount,
                        'waiver_amount'    => 0.00,
                        'balance'          => $balance,
                        'status'           => $paymentProfile['status'],
                        'notes'            => 'Term 1 Standard Enrollment Invoice',
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                $invoice = DB::table('fee_invoices')
                    ->where('school_id', $school->id)
                    ->where('invoice_number', $invNumber)
                    ->first();

                // Invoice Item breakdown
                DB::table('fee_invoice_items')->updateOrInsert(
                    ['school_id' => $school->id, 'fee_invoice_id' => $invoice->id],
                    [
                        'amount'        => $totalAmount,
                        'paid_amount'   => $paidAmount,
                        'waiver_amount' => 0.00,
                        'balance'       => $balance,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]
                );

                // Initial Debit entry in Ledger
                DB::table('fee_ledger_entries')->updateOrInsert(
                    [
                        'school_id'        => $school->id,
                        'student_id'       => $student->id,
                        'reference_number' => $invNumber,
                    ],
                    [
                        'academic_year_id' => $academicYearId,
                        'term'             => 'Term 1',
                        'transaction_type' => 'invoice',
                        'debit'            => $totalAmount,
                        'credit'           => 0.00,
                        'running_balance'  => $totalAmount,
                        'reference_type'   => 'fee_invoice',
                        'reference_id'     => $invoice->id,
                        'entry_date'       => '2026-01-06',
                        'description'      => "Term 1 Invoice: {$invNumber}",
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                // If payment made, record payment receipt and credit ledger
                if ($paidAmount > 0) {
                    $receiptNo = 'RCT-' . strtoupper(substr($key, 0, 2)) . '-' . (1000 + $student->id);

                    DB::table('fee_payments')->updateOrInsert(
                        ['school_id' => $school->id, 'receipt_no' => $receiptNo],
                        [
                            'student_id'       => $student->id,
                            'fee_structure_id' => $struct->id,
                            'amount_due'       => $totalAmount,
                            'amount_paid'      => $paidAmount,
                            'discount'         => 0.00,
                            'fine'             => 0.00,
                            'payment_date'     => '2026-01-12',
                            'month_year'       => '2026-01',
                            'method'           => 'mpesa',
                            'status'           => $paymentProfile['status'] === 'paid' ? 'paid' : 'partial',
                            'note'             => 'M-Pesa STK Push Confirmation Ref: QKL' . rand(10000, 99999),
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ]
                    );

                    $payment = DB::table('fee_payments')
                        ->where('school_id', $school->id)
                        ->where('receipt_no' , $receiptNo)
                        ->first();

                    DB::table('fee_ledger_entries')->updateOrInsert(
                        [
                            'school_id'        => $school->id,
                            'student_id'       => $student->id,
                            'reference_number' => $receiptNo,
                        ],
                        [
                            'academic_year_id' => $academicYearId,
                            'term'             => 'Term 1',
                            'transaction_type' => 'payment',
                            'debit'            => 0.00,
                            'credit'           => $paidAmount,
                            'running_balance'  => $balance,
                            'reference_type'   => 'fee_payment',
                            'reference_id'     => $payment->id,
                            'entry_date'       => '2026-01-12',
                            'description'      => "Fee Payment via M-Pesa: {$receiptNo}",
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ]
                    );
                }
            }
        }

        $this->command->info('Successfully seeded Financial Structures, Invoices, M-Pesa Payments, and Payrolls for all 3 schools.');
    }
}