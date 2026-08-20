<?php

namespace App\Policies;

use App\Models\Hostel;
use App\Models\Staff;
use App\Models\User;
use App\Policies\Concerns\ChecksOperationsTenant;

class HostelPolicy
{
    use ChecksOperationsTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('hostel.view');
    }

    public function view(User $user, Hostel $hostel): bool
    {
        return $this->ownsTenantRecord($user, $hostel) && $user->can('hostel.view');
    }

    public function create(User $user, ?array $data = null): bool
    {
        return $this->hasTenantContext($user)
            && $this->ownsOptionalRelatedRecord($user, Staff::class, $data['warden_id'] ?? null)
            && $user->can('hostel.manage');
    }

    public function update(User $user, Hostel $hostel, ?array $data = null): bool
    {
        return $this->ownsTenantRecord($user, $hostel)
            && $this->ownsOptionalRelatedRecord($user, Staff::class, $data['warden_id'] ?? null)
            && $user->can('hostel.manage');
    }

    public function delete(User $user, Hostel $hostel): bool
    {
        return $this->ownsTenantRecord($user, $hostel) && $user->can('hostel.manage');
    }
}
