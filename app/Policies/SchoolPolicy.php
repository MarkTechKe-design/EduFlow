<?php

namespace App\Policies;

use App\Models\School;
use App\Models\User;
use App\Policies\Concerns\ChecksPlatformAdministrationTenant;

class SchoolPolicy
{
    use ChecksPlatformAdministrationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('schools.view');
    }

    public function view(User $user, School $school): bool
    {
        return $this->ownsPlatformRecord($user, $school) && $user->can('schools.view');
    }

    public function create(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('schools.create');
    }

    public function update(User $user, School $school): bool
    {
        return $this->ownsPlatformRecord($user, $school) && $user->can('schools.edit');
    }

    public function delete(User $user, School $school): bool
    {
        return $this->ownsPlatformRecord($user, $school) && $user->can('schools.delete');
    }

    public function suspend(User $user, School $school): bool
    {
        return $this->ownsPlatformRecord($user, $school) && $user->can('schools.suspend');
    }

    public function activate(User $user, School $school): bool
    {
        return $this->ownsPlatformRecord($user, $school) && $user->can('schools.suspend');
    }

    private function ownsPlatformRecord(User $user, School $school): bool
    {
        return $this->hasPlatformContext($user) && $school->exists && ! $school->trashed();
    }
}
