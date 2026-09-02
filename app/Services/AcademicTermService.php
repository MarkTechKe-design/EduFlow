<?php

namespace App\Services;

use App\Models\AcademicYear;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AcademicTermService
{
    /**
     * Standard Kenya MoE baseline defaults.
     */
    public const DEFAULT_TERMS = [
        'Term 1' => ['start_month' => 1, 'start_day' => 5,  'end_month' => 4,  'end_day' => 10, 'weeks' => 14],
        'Term 2' => ['start_month' => 5, 'start_day' => 4,  'end_month' => 8,  'end_day' => 7,  'weeks' => 14],
        'Term 3' => ['start_month' => 8, 'start_day' => 31, 'end_month' => 10, 'end_day' => 30, 'weeks' => 10],
    ];

    /**
     * Fetch configured terms for a school and year, falling back to MoE defaults.
     */
    public static function getTermBoundaries(int $year, ?int $schoolId = null): array
    {
        $terms = [
            'Term 1' => [
                'start' => Carbon::create($year, 1, 5)->startOfWeek(Carbon::MONDAY),
                'end'   => Carbon::create($year, 4, 10)->endOfWeek(Carbon::FRIDAY),
            ],
            'Term 2' => [
                'start' => Carbon::create($year, 5, 4)->startOfWeek(Carbon::MONDAY),
                'end'   => Carbon::create($year, 8, 7)->endOfWeek(Carbon::FRIDAY),
            ],
            'Term 3' => [
                'start' => Carbon::create($year, 8, 31)->startOfWeek(Carbon::MONDAY),
                'end'   => Carbon::create($year, 10, 30)->endOfWeek(Carbon::FRIDAY),
            ],
        ];

        if ($schoolId) {
            $setting = DB::table('school_settings')
                ->where('school_id', $schoolId)
                ->where('key', "academic_terms_{$year}")
                ->value('value');

            if ($setting) {
                $decoded = json_decode($setting, true);
                if (is_array($decoded)) {
                    foreach (['Term 1', 'Term 2', 'Term 3'] as $tKey) {
                        if (!empty($decoded[$tKey]['start']) && !empty($decoded[$tKey]['end'])) {
                            $terms[$tKey]['start'] = Carbon::parse($decoded[$tKey]['start'])->startOfWeek(Carbon::MONDAY);
                            $terms[$tKey]['end']   = Carbon::parse($decoded[$tKey]['end'])->endOfWeek(Carbon::FRIDAY);
                        }
                    }
                }
            }
        }

        return $terms;
    }

    /**
     * Resolve Kenyan academic context for a given date and school.
     */
    public static function resolveContext(?string $dateString = null, ?int $schoolId = null): array
    {
        $date = $dateString ? Carbon::parse($dateString) : Carbon::today();
        $year = $date->year;

        $academicYear = null;
        if ($schoolId) {
            $academicYear = AcademicYear::where('school_id', $schoolId)
                ->where(function ($q) use ($date) {
                    $q->where('is_current', true)
                      ->orWhere(function ($sub) use ($date) {
                          $sub->whereDate('start_date', '<=', $date)
                              ->whereDate('end_date', '>=', $date);
                      });
                })
                ->orderByDesc('is_current')
                ->first();
        }

        $academicYearName = $academicYear?->name ?? (string) $year;
        $academicYearId   = $academicYear?->id;

        $boundaries = self::getTermBoundaries($year, $schoolId);

        if ($date->betweenIncluded($boundaries['Term 1']['start'], $boundaries['Term 1']['end']) || $date->lt($boundaries['Term 2']['start'])) {
            $term = 'Term 1';
            $termStart = $boundaries['Term 1']['start'];
            $termEnd   = $boundaries['Term 1']['end'];
        } elseif ($date->betweenIncluded($boundaries['Term 2']['start'], $boundaries['Term 2']['end']) || $date->lt($boundaries['Term 3']['start'])) {
            $term = 'Term 2';
            $termStart = $boundaries['Term 2']['start'];
            $termEnd   = $boundaries['Term 2']['end'];
        } else {
            $term = 'Term 3';
            $termStart = $boundaries['Term 3']['start'];
            $termEnd   = $boundaries['Term 3']['end'];
        }

        $currentMonday = (clone $date)->startOfWeek(Carbon::MONDAY);
        $diffWeeks = $termStart->diffInWeeks($currentMonday);
        $weekNumber = (int) max(1, $diffWeeks + 1);

        $weekStart = $currentMonday->toDateString();
        $weekEnd = (clone $currentMonday)->endOfWeek(Carbon::FRIDAY)->toDateString();

        return [
            'academic_year_id'   => $academicYearId,
            'academic_year_name' => $academicYearName,
            'year'               => $year,
            'term'               => $term,
            'week_number'        => $weekNumber,
            'date'               => $date->toDateString(),
            'week_start'         => $weekStart,
            'week_end'           => $weekEnd,
            'term_start'         => $termStart->toDateString(),
            'term_end'           => $termEnd->toDateString(),
            'available_terms'    => ['Term 1', 'Term 2', 'Term 3'],
            'max_weeks'          => 14,
        ];
    }

    /**
     * Resolve date range given year, term, and week number for a school.
     */
    public static function resolveWeekDateRange(int $year, string $term, int $weekNumber, ?int $schoolId = null): array
    {
        $boundaries = self::getTermBoundaries($year, $schoolId);
        $termStart = $boundaries[$term]['start'] ?? $boundaries['Term 1']['start'];

        $targetMonday = (clone $termStart)->addWeeks(max(0, $weekNumber - 1));
        $targetFriday = (clone $targetMonday)->endOfWeek(Carbon::FRIDAY);

        return [
            'week_start' => $targetMonday->toDateString(),
            'week_end'   => $targetFriday->toDateString(),
            'mid_date'   => (clone $targetMonday)->addDays(2)->toDateString(),
        ];
    }
}