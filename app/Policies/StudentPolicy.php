<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\School;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('students.view');
    }

    public function view(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('students.create');
    }

    public function update(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.edit');
    }

    public function delete(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.delete');
    }

    public function restore(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.delete');
    }

    public function forceDelete(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.delete');
    }

    public function export(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.export');
    }

    public function uploadDocument(User $user, Student $student): bool
    {
        return $this->ownsStudent($user, $student) && $user->can('students.create');
    }

    private function hasTenantContext(User $user): bool
    {
        return $user->school_id !== null
            && ! $user->hasRole('super-admin')
            && School::query()->whereKey($user->school_id)->where('status', 'active')->exists();
    }

    private function ownsStudent(User $user, Student $student): bool
    {
        return $this->hasTenantContext($user)
            && (int) $user->school_id === (int) $student->school_id;
    }
}
