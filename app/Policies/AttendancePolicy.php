<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use App\Policies\Concerns\ChecksOperationsTenant;

class AttendancePolicy
{
    use ChecksOperationsTenant;

    public function viewAny(User $user, ?array $filters = null): bool
    {
        return $this->ownsFilters($user, $filters)
            && $user->can('attendance.view');
    }

    public function viewStudentCalendar(User $user, Student $student): bool
    {
        return $this->ownsTenantRecord($user, $student)
            && $user->can('attendance.view');
    }

    public function markStudent(User $user, array $context): bool
    {
        if (! $this->hasTenantContext($user)
            || ! $this->ownsRelatedRecord($user, SchoolClass::class, (int) $context['class_id'])) {
            return false;
        }

        foreach ($context['records'] ?? [] as $record) {
            if (! isset($record['student_id'])
                || ! $this->ownsRelatedRecord($user, Student::class, (int) $record['student_id'])
                || ! Student::withoutGlobalScopes()
                    ->whereKey((int) $record['student_id'])
                    ->where('school_id', $user->school_id)
                    ->where('class_id', $context['class_id'])
                    ->exists()) {
                return false;
            }
        }

        return $user->can('attendance.mark');
    }

    public function markStaff(User $user, array $context): bool
    {
        if (! $this->hasTenantContext($user)) {
            return false;
        }

        foreach ($context['records'] ?? [] as $record) {
            if (! isset($record['staff_id'])
                || ! $this->ownsRelatedRecord($user, Staff::class, (int) $record['staff_id'])) {
                return false;
            }
        }

        return $user->can('attendance.mark');
    }

    public function report(User $user, ?array $filters = null): bool
    {
        return $this->ownsFilters($user, $filters)
            && $user->can('attendance.report');
    }

    public function export(User $user, ?array $filters = null): bool
    {
        return $this->ownsFilters($user, $filters)
            && $user->can('attendance.export');
    }

    private function ownsFilters(User $user, ?array $filters): bool
    {
        if (! $this->hasTenantContext($user)) {
            return false;
        }

        if (isset($filters['class_id'])
            && ! $this->ownsRelatedRecord($user, SchoolClass::class, (int) $filters['class_id'])) {
            return false;
        }

        if (isset($filters['section_id'])
            && ! $this->ownsRelatedRecord($user, Section::class, (int) $filters['section_id'])) {
            return false;
        }

        if (isset($filters['department_id'])
            && ! $this->ownsRelatedRecord($user, Department::class, (int) $filters['department_id'])) {
            return false;
        }

        return true;
    }
}
