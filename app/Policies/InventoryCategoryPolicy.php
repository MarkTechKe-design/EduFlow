<?php

namespace App\Policies;

use App\Models\InventoryCategory;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class InventoryCategoryPolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.view');
    }

    public function view(User $user, InventoryCategory $category): bool
    {
        return $this->ownsTenantRecord($user, $category) && $user->can('inventory.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.manage');
    }

    public function update(User $user, InventoryCategory $category): bool
    {
        return $this->ownsTenantRecord($user, $category) && $user->can('inventory.manage');
    }

    public function delete(User $user, InventoryCategory $category): bool
    {
        return $this->ownsTenantRecord($user, $category) && $user->can('inventory.manage');
    }
}