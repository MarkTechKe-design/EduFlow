<?php

namespace App\Policies;

use App\Models\Staff;
use App\Models\School;
use App\Models\User;

class StaffPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('staff.view');
    }

    public function view(User $user, Staff $staff): bool
    {
        return $this->ownsStaff($user, $staff) && $user->can('staff.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('staff.create');
    }

    public function update(User $user, Staff $staff): bool
    {
        return $this->ownsStaff($user, $staff) && $user->can('staff.edit');
    }

    public function delete(User $user, Staff $staff): bool
    {
        return $this->ownsStaff($user, $staff) && $user->can('staff.delete');
    }

    public function restore(User $user, Staff $staff): bool
    {
        return $this->ownsStaff($user, $staff) && $user->can('staff.delete');
    }

    public function forceDelete(User $user, Staff $staff): bool
    {
        return $this->ownsStaff($user, $staff) && $user->can('staff.delete');
    }

    public function uploadDocument(User $user, Staff $staff): bool
    {
        return $this->ownsStaff($user, $staff) && $user->can('staff.edit');
    }

    private function hasTenantContext(User $user): bool
    {
        return $user->school_id !== null
            && ! $user->hasRole('super-admin')
            && School::query()->whereKey($user->school_id)->where('status', 'active')->exists();
    }

    private function ownsStaff(User $user, Staff $staff): bool
    {
        return $this->hasTenantContext($user)
            && (int) $user->school_id === (int) $staff->school_id;
    }
}
