<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NationalCocurricularCalendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year',
        'term',
        'category_name',
        'activity_name',
        'education_level',
        'age_bracket',
        'competition_level',
        'start_date',
        'end_date',
        'reporting_date',
        'departure_date',
        'venue',
        'host_county',
        'host_region',
        'circular_reference',
        'remarks',
    ];

    protected $casts = [
        'start_date'     => 'date',
        'end_date'       => 'date',
        'reporting_date' => 'date',
        'departure_date' => 'date',
    ];
}