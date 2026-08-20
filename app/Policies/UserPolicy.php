<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPlatformAdministrationTenant;

class UserPolicy
{
    use ChecksPlatformAdministrationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('users.view');
    }

    public function create(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('users.create');
    }

    public function update(User $user, User $target): bool
    {
        return $this->ownsPlatformUser($user, $target) && $user->can('users.edit');
    }

    public function delete(User $user, User $target): bool
    {
        return $this->ownsPlatformUser($user, $target) && $user->can('users.delete');
    }

    public function suspend(User $user, User $target): bool
    {
        return $this->ownsPlatformUser($user, $target) && $user->can('users.edit');
    }

    public function activate(User $user, User $target): bool
    {
        return $this->ownsPlatformUser($user, $target) && $user->can('users.edit');
    }

    public function resetPassword(User $user, User $target): bool
    {
        return $this->ownsPlatformUser($user, $target) && $user->can('users.edit');
    }

    public function schoolViewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('users.view');
    }

    public function schoolCreate(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('users.create');
    }

    public function schoolUpdate(User $user, User $target): bool
    {
        return $this->ownsSchoolUser($user, $target) && $user->can('users.edit');
    }

    public function schoolDelete(User $user, User $target): bool
    {
        return $this->ownsSchoolUser($user, $target) && $user->can('users.delete');
    }

    public function schoolSuspend(User $user, User $target): bool
    {
        return $this->ownsSchoolUser($user, $target) && $user->can('users.edit');
    }

    public function schoolActivate(User $user, User $target): bool
    {
        return $this->ownsSchoolUser($user, $target) && $user->can('users.edit');
    }

    private function ownsPlatformUser(User $user, User $target): bool
    {
        return $this->hasPlatformContext($user)
            && $target->exists
            && ! $target->trashed()
            && ! $target->is($user);
    }

    private function ownsSchoolUser(User $user, User $target): bool
    {
        return $this->hasTenantContext($user)
            && $target->exists
            && ! $target->trashed()
            && ! $target->is($user)
            && (int) $target->school_id === (int) $user->school_id;
    }
}
