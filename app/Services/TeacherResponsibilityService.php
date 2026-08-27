<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class TeacherResponsibilityService
{
    /**
     * Resolve active academic year ID for a school.
     */
    public static function getActiveAcademicYearId(int $schoolId): ?int
    {
        $query = AcademicYear::withoutGlobalScopes()->where('school_id', $schoolId);

        if (Schema::hasColumn('academic_years', 'status')) {
            $yearId = (clone $query)->where('status', 'active')->value('id');
            if ($yearId) return $yearId;
        }

        if (Schema::hasColumn('academic_years', 'is_current')) {
            $yearId = (clone $query)->where('is_current', true)->value('id');
            if ($yearId) return $yearId;
        }

        if (Schema::hasColumn('academic_years', 'is_active')) {
            $yearId = (clone $query)->where('is_active', true)->value('id');
            if ($yearId) return $yearId;
        }

        return $query->latest('id')->value('id');
    }

    /**
     * Resolve staff ID for a user.
     */
    public static function resolveStaffId(User $user): ?int
    {
        return Staff::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->value('id')
            ?? Staff::withoutGlobalScopes()
                ->where('school_id', $user->school_id)
                ->where('email', $user->email)
                ->value('id');
    }

    /**
     * Check if a user is the active Class Teacher for a class/stream.
     */
    public static function isClassTeacher(User $user, int $classId, ?int $sectionId = null, ?int $academicYearId = null): bool
    {
        if ($user->hasRole(['super-admin', 'school-admin', 'principal'])) {
            return true;
        }

        $staffId = self::resolveStaffId($user);
        $academicYearId = $academicYearId ?? self::getActiveAcademicYearId($user->school_id);
        if (!$academicYearId) {
            return false;
        }

        $query = TeacherAssignment::withoutGlobalScopes()
            ->where('school_id', $user->school_id)
            ->where('academic_year_id', $academicYearId)
            ->where('class_id', $classId)
            ->whereIn('assignment_type', ['class_teacher', 'co_class_teacher'])
            ->where('status', 'active')
            ->where(function ($q) use ($staffId, $user) {
                if ($staffId) {
                    $q->where('staff_id', $staffId)->orWhere('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id);
                }
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
            });

        if ($sectionId) {
            $query->where(function ($q) use ($sectionId) {
                $q->whereNull('section_id')->orWhere('section_id', $sectionId);
            });
        }

        return $query->exists();
    }

    /**
     * Check if user has active teaching authority for a specific subject/learning area.
     */
    public static function isSubjectTeacher(User $user, int $classId, int $subjectId, ?int $sectionId = null, ?int $academicYearId = null): bool
    {
        if ($user->hasRole(['super-admin', 'school-admin', 'principal'])) {
            return true;
        }

        $staffId = self::resolveStaffId($user);
        $academicYearId = $academicYearId ?? self::getActiveAcademicYearId($user->school_id);
        if (!$academicYearId) {
            return false;
        }

        $query = TeacherAssignment::withoutGlobalScopes()
            ->where('school_id', $user->school_id)
            ->where('academic_year_id', $academicYearId)
            ->where('class_id', $classId)
            ->where('subject_id', $subjectId)
            ->where('status', 'active')
            ->where(function ($q) use ($staffId, $user) {
                if ($staffId) {
                    $q->where('staff_id', $staffId)->orWhere('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id);
                }
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
            });

        if ($sectionId) {
            $query->where(function ($q) use ($sectionId) {
                $q->whereNull('section_id')->orWhere('section_id', $sectionId);
            });
        }

        return $query->exists();
    }

    public static function canMarkAttendance(User $user, int $classId, ?int $sectionId = null): bool
    {
        return self::isClassTeacher($user, $classId, $sectionId);
    }

    public static function canEnterAssessment(User $user, int $classId, int $subjectId, ?int $sectionId = null): bool
    {
        return self::isSubjectTeacher($user, $classId, $subjectId, $sectionId);
    }

    public static function getTeacherActiveResponsibilities(User $user, ?int $academicYearId = null): array
    {
        $staffId = self::resolveStaffId($user);
        $academicYearId = $academicYearId ?? self::getActiveAcademicYearId($user->school_id);

        $assignments = TeacherAssignment::withoutGlobalScopes()
            ->where('school_id', $user->school_id)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->where(function ($q) use ($staffId, $user) {
                if ($staffId) {
                    $q->where('staff_id', $staffId)->orWhere('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id);
                }
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
            })
            ->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name,code'])
            ->get();

        return [
            'class_teacher_assignments'   => $assignments->whereIn('assignment_type', ['class_teacher', 'co_class_teacher'])->values(),
            'subject_teacher_assignments' => $assignments->where('assignment_type', 'subject_teacher')->values(),
            'assigned_class_ids'          => $assignments->pluck('class_id')->unique()->values()->all(),
            'assigned_subject_ids'        => $assignments->pluck('subject_id')->filter()->unique()->values()->all(),
        ];
    }

    public static function detectUnassignedCurriculum(int $schoolId, ?int $academicYearId = null): array
    {
        $academicYearId = $academicYearId ?? self::getActiveAcademicYearId($schoolId);
        if (!$academicYearId) {
            return ['unassigned_classes' => [], 'teachers_without_assignments' => [], 'total_unassigned_classes_count' => 0, 'total_unassigned_staff_count' => 0];
        }

        $classes = SchoolClass::withoutGlobalScopes()->where('school_id', $schoolId)->with(['sections' => fn ($q) => $q->withoutGlobalScopes()])->get();
        $activeClassTeacherAssignments = TeacherAssignment::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('academic_year_id', $academicYearId)
            ->whereIn('assignment_type', ['class_teacher', 'co_class_teacher'])
            ->where('status', 'active')
            ->get();

        $unassignedClasses = [];
        foreach ($classes as $cls) {
            if ($cls->sections->isEmpty()) {
                $hasCt = $activeClassTeacherAssignments->where('class_id', $cls->id)->whereNull('section_id')->isNotEmpty();
                if (!$hasCt) {
                    $unassignedClasses[] = [
                        'class_id'     => $cls->id,
                        'class_name'   => $cls->name,
                        'section_id'   => null,
                        'section_name' => 'Whole Class',
                    ];
                }
            } else {
                foreach ($cls->sections as $sec) {
                    $hasCt = $activeClassTeacherAssignments->where('class_id', $cls->id)->where('section_id', $sec->id)->isNotEmpty();
                    if (!$hasCt) {
                        $unassignedClasses[] = [
                            'class_id'     => $cls->id,
                            'class_name'   => $cls->name,
                            'section_id'   => $sec->id,
                            'section_name' => $sec->name,
                        ];
                    }
                }
            }
        }

        $teachingStaffIds = Staff::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->pluck('id');

        $assignedStaffIds = TeacherAssignment::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'active')
            ->pluck('staff_id')
            ->unique();

        $unassignedStaff = Staff::withoutGlobalScopes()
            ->whereIn('id', $teachingStaffIds->diff($assignedStaffIds))
            ->select('id', 'first_name', 'last_name', 'emp_id')
            ->get();

        return [
            'unassigned_classes'             => $unassignedClasses,
            'teachers_without_assignments'   => $unassignedStaff,
            'total_unassigned_classes_count' => count($unassignedClasses),
            'total_unassigned_staff_count'   => $unassignedStaff->count(),
        ];
    }
}