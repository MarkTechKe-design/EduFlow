<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Shift;
use App\Models\Holiday;
use Illuminate\Support\Facades\Schema;

class SchoolSetupSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        if (!$school) {
            $this->command?->warn('No school found. Run DemoUserSeeder first.');
            return;
        }
        $sid = $school->id;

        // 1. Full CBC/CBE Structure (PP1 to Grade 12) + Legacy 8-4-4 (Form 1 to 4)
        $classesData = [
            ['name' => 'PP1',      'numeric_name' => 0,  'capacity' => 35],
            ['name' => 'PP2',      'numeric_name' => 0,  'capacity' => 35],
            ['name' => 'Grade 1',  'numeric_name' => 1,  'capacity' => 40],
            ['name' => 'Grade 2',  'numeric_name' => 2,  'capacity' => 40],
            ['name' => 'Grade 3',  'numeric_name' => 3,  'capacity' => 40],
            ['name' => 'Grade 4',  'numeric_name' => 4,  'capacity' => 45],
            ['name' => 'Grade 5',  'numeric_name' => 5,  'capacity' => 45],
            ['name' => 'Grade 6',  'numeric_name' => 6,  'capacity' => 45],
            ['name' => 'Grade 7',  'numeric_name' => 7,  'capacity' => 45],
            ['name' => 'Grade 8',  'numeric_name' => 8,  'capacity' => 45],
            ['name' => 'Grade 9',  'numeric_name' => 9,  'capacity' => 45],
            ['name' => 'Grade 10', 'numeric_name' => 10, 'capacity' => 45],
            ['name' => 'Grade 11', 'numeric_name' => 11, 'capacity' => 45],
            ['name' => 'Grade 12', 'numeric_name' => 12, 'capacity' => 45],
            ['name' => 'Form 1',   'numeric_name' => 13, 'capacity' => 45],
            ['name' => 'Form 2',   'numeric_name' => 14, 'capacity' => 45],
            ['name' => 'Form 3',   'numeric_name' => 15, 'capacity' => 45],
            ['name' => 'Form 4',   'numeric_name' => 16, 'capacity' => 45],
        ];

        foreach ($classesData as $cd) {
            $class = SchoolClass::withoutGlobalScopes()->updateOrCreate(
                ['school_id' => $sid, 'name' => $cd['name']],
                ['numeric_name' => $cd['numeric_name'], 'capacity' => $cd['capacity']]
            );

            // Database-driven stream examples
            $sampleStreams = str_starts_with($cd['name'], 'Form') ? ['East', 'West'] : ['East', 'West'];
            foreach ($sampleStreams as $stream) {
                Section::withoutGlobalScopes()->firstOrCreate(
                    ['school_id' => $sid, 'class_id' => $class->id, 'name' => $stream],
                    ['capacity' => 45]
                );
            }
        }

        // 2. Subjects mapping
        $coreSubjects = [
            ['name' => 'Mathematics',                   'code' => 'MATH', 'type' => 'theory'],
            ['name' => 'English Language',              'code' => 'ENG',  'type' => 'theory'],
            ['name' => 'Kiswahili & Fasihi',            'code' => 'KISW', 'type' => 'theory'],
            ['name' => 'Integrated Science / Sciences', 'code' => 'SCI',  'type' => 'practical'],
            ['name' => 'Social Studies / Humanities',   'code' => 'SST',  'type' => 'theory'],
            ['name' => 'Agriculture & Nutrition',       'code' => 'AGRI', 'type' => 'practical'],
            ['name' => 'Creative Arts & Sports',        'code' => 'ARTS', 'type' => 'practical'],
            ['name' => 'Pre-Technical Studies',         'code' => 'PREC', 'type' => 'practical'],
            ['name' => 'Religious Education (CRE/IRE)', 'code' => 'RE',   'type' => 'theory'],
        ];

        $allClasses = SchoolClass::withoutGlobalScopes()->where('school_id', $sid)->get();
        foreach ($allClasses as $cls) {
            foreach ($coreSubjects as $sub) {
                $codeSuffix = preg_replace('/[^0-9A-Za-z]/', '', $cls->name);
                Subject::withoutGlobalScopes()->firstOrCreate(
                    [
                        'school_id' => $sid,
                        'class_id'  => $cls->id,
                        'code'      => $sub['code'] . '-' . $codeSuffix,
                    ],
                    [
                        'name' => $sub['name'],
                        'type' => $sub['type'],
                    ]
                );
            }
        }

        // 3. Shifts
        $shiftPayload = ['start_time' => '07:30:00', 'end_time' => '16:00:00'];
        if (Schema::hasColumn('shifts', 'is_active')) $shiftPayload['is_active'] = true;
        if (Schema::hasColumn('shifts', 'status'))    $shiftPayload['status'] = 'active';
        Shift::withoutGlobalScopes()->firstOrCreate(['school_id' => $sid, 'name' => 'Regular Day'], $shiftPayload);

        // 4. Kenya Public Holidays (2026)
        $holidays = [
            ['name' => 'New Year’s Day', 'date_start' => '2026-01-01', 'date_end' => '2026-01-01'],
            ['name' => 'Good Friday',     'date_start' => '2026-04-03', 'date_end' => '2026-04-03'],
            ['name' => 'Easter Monday',   'date_start' => '2026-04-06', 'date_end' => '2026-04-06'],
            ['name' => 'Labour Day',      'date_start' => '2026-05-01', 'date_end' => '2026-05-01'],
            ['name' => 'Madaraka Day',    'date_start' => '2026-06-01', 'date_end' => '2026-06-01'],
            ['name' => 'Huduma Day',      'date_start' => '2026-10-10', 'date_end' => '2026-10-10'],
            ['name' => 'Mashujaa Day',    'date_start' => '2026-10-20', 'date_end' => '2026-10-20'],
            ['name' => 'Jamhuri Day',     'date_start' => '2026-12-12', 'date_end' => '2026-12-12'],
        ];

        $titleCol = Schema::hasColumn('holidays', 'name') ? 'name' : (Schema::hasColumn('holidays', 'title') ? 'title' : null);
        $fromCol  = Schema::hasColumn('holidays', 'from_date') ? 'from_date' : (Schema::hasColumn('holidays', 'start_date') ? 'start_date' : (Schema::hasColumn('holidays', 'date') ? 'date' : null));
        $toCol    = Schema::hasColumn('holidays', 'to_date') ? 'to_date' : (Schema::hasColumn('holidays', 'end_date') ? 'end_date' : null);

        if ($titleCol && $fromCol) {
            foreach ($holidays as $h) {
                $hPayload = ['school_id' => $sid, $titleCol => $h['name'], $fromCol => $h['date_start']];
                if ($toCol) $hPayload[$toCol] = $h['date_end'];
                Holiday::withoutGlobalScopes()->firstOrCreate(['school_id' => $sid, $titleCol => $h['name']], $hPayload);
            }
        }

        $this->command?->info('School setup seeded deterministically with unique CBC & 8-4-4 levels.');
    }
}