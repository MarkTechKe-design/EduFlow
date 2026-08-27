<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollStatutoryConfig extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'payroll_statutory_configs';

    protected $fillable = [
        'school_id',
        'nssf_enabled',
        'nssf_rate',
        'nssf_tier1_limit',
        'nssf_tier2_limit',
        'shif_enabled',
        'shif_rate',
        'shif_min_amount',
        'housing_levy_enabled',
        'housing_levy_rate',
        'paye_enabled',
        'paye_brackets',
        'personal_relief',
        'shif_relief_rate',
        'shif_relief_max',
        'housing_relief_rate',
        'housing_relief_max',
    ];

    protected $casts = [
        'nssf_enabled'         => 'boolean',
        'nssf_rate'            => 'float',
        'nssf_tier1_limit'     => 'float',
        'nssf_tier2_limit'     => 'float',
        'shif_enabled'         => 'boolean',
        'shif_rate'            => 'float',
        'shif_min_amount'      => 'float',
        'housing_levy_enabled' => 'boolean',
        'housing_levy_rate'    => 'float',
        'paye_enabled'         => 'boolean',
        'paye_brackets'        => 'array',
        'personal_relief'      => 'float',
        'shif_relief_rate'     => 'float',
        'shif_relief_max'      => 'float',
        'housing_relief_rate'  => 'float',
        'housing_relief_max'   => 'float',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    /**
     * Get or initialize default Kenyan statutory rates for a school.
     */
    public static function getOrCreateForSchool(int $schoolId): self
    {
        return static::firstOrCreate(
            ['school_id' => $schoolId],
            [
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
            ]
        );
    }
}