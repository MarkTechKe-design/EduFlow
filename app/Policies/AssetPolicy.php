<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class AssetPolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.view');
    }

    public function view(User $user, Asset $asset): bool
    {
        return $this->ownsTenantRecord($user, $asset) && $user->can('inventory.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.manage');
    }

    public function update(User $user, Asset $asset): bool
    {
        return $this->ownsTenantRecord($user, $asset) && $user->can('inventory.manage');
    }

    public function delete(User $user, Asset $asset): bool
    {
        return $this->ownsTenantRecord($user, $asset) && $user->can('inventory.manage');
    }

    public function maintain(User $user, Asset $asset): bool
    {
        return $this->ownsTenantRecord($user, $asset) && $user->can('inventory.manage');
    }
}