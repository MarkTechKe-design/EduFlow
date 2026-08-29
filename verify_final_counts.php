<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = [
    'schools', 'academic_years', 'users', 'departments', 'designations', 'staff',
    'classes', 'sections', 'subjects', 'teacher_assignments',
    'guardians', 'students', 'student_guardians', 'student_enrollments',
    'salary_structures', 'payrolls', 'fee_categories', 'fee_structures', 'fee_invoices', 'fee_payments', 'fee_ledger_entries',
    'exams', 'marks', 'cbc_assessments', 'assessment_strands', 'assessment_scores',
    'activity_houses', 'activity_categories', 'activities', 'school_clubs', 'club_memberships',
    'attendances', 'timetables', 'books', 'book_issues', 'hostels', 'hostel_rooms', 'hostel_allocations', 'vehicles', 'routes', 'student_route'
];

echo str_pad("TABLE NAME", 35) . "VERIFIED ROWS" . PHP_EOL;
echo str_repeat("=", 50) . PHP_EOL;

foreach ($tables as $t) {
    $count = Illuminate\Support\Facades\DB::table($t)->count();
    echo str_pad($t, 35) . $count . PHP_EOL;
}