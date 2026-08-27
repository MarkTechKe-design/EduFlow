<?php

namespace App\Http\Middleware;

use App\Support\Authorization\ModuleAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleEnabled
{
    public function __construct(private ModuleAccessService $modules) {}

    public function handle(Request $request, Closure $next): Response
    {
        $module = $this->moduleForRoute($request->route()?->getName());

        if ($module !== null) {
            $user = $request->user();
            abort_unless($user !== null, 403);
            $this->modules->assertEnabledForUser($user, $module);
        }

        return $next($request);
    }

    private function moduleForRoute(?string $routeName): ?string
    {
        if ($routeName === null) return null;

        $prefixes = [
            'school.students.' => 'students',
            'school.staff.' => 'staff',
            'school.attendance.' => 'attendance',
            'school.timetable.' => 'timetable',
            'school.exams.' => 'exams',
            'school.grade-scales.' => 'exams',
            'school.fees.' => 'fees',
            'school.library.' => 'library',
            'school.transport.' => 'transport',
            'school.hostel.' => 'hostel',
            'school.inventory.' => 'inventory',
            'school.homework.' => 'homework',
            'school.communication.' => 'communication',
            'school.reports.' => 'reports',
            'school.hr.' => 'hr',
            'school.cocurricular.' => 'cocurricular',
            'student.cocurricular' => 'cocurricular',
            'parent.cocurricular' => 'cocurricular',
            'student.dashboard' => 'students',
            'student.attendance' => 'attendance',
            'student.timetable' => 'timetable',
            'student.results' => 'exams',
            'student.homework' => 'homework',
            'student.fees' => 'fees',
            'student.announcements' => 'communication',
            'parent.dashboard' => 'students',
            'parent.attendance' => 'attendance',
            'parent.results' => 'exams',
            'parent.fees' => 'fees',
            'parent.announcements' => 'communication',
        ];

        foreach ($prefixes as $prefix => $module) {
            if ($routeName === $prefix || str_starts_with($routeName, $prefix)) return $module;
        }

        return null;
    }
}