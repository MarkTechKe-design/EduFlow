<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\User;
use App\Policies\Concerns\ChecksAcademicTenant;

class ExamPolicy
{
    use ChecksAcademicTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('exams.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('exams.create');
    }

    public function update(User $user, Exam $exam): bool
    {
        return $this->ownsTenantRecord($user, $exam) && $user->can('exams.edit');
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $this->ownsTenantRecord($user, $exam) && $user->can('exams.delete');
    }

    public function marks(User $user, Exam $exam): bool
    {
        return $this->ownsTenantRecord($user, $exam) && $user->can('marks.view');
    }

    public function saveMarks(User $user, Exam $exam): bool
    {
        return $this->ownsTenantRecord($user, $exam) && $user->can('marks.entry');
    }

    public function results(User $user, Exam $exam): bool
    {
        return $this->ownsTenantRecord($user, $exam) && $user->can('results.view');
    }
}
