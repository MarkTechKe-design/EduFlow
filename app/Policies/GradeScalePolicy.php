<?php

namespace App\Policies;

use App\Models\GradeScale;
use App\Models\User;
use App\Policies\Concerns\ChecksAcademicTenant;

class GradeScalePolicy
{
    use ChecksAcademicTenant;

    // Grade scales have no dedicated permission; exams permissions are the
    // existing permission boundary for this exam configuration workflow.
    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('exams.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('exams.edit');
    }

    public function update(User $user, GradeScale $gradeScale): bool
    {
        return $this->ownsTenantRecord($user, $gradeScale) && $user->can('exams.edit');
    }

    public function delete(User $user, GradeScale $gradeScale): bool
    {
        return $this->ownsTenantRecord($user, $gradeScale) && $user->can('exams.edit');
    }
}
