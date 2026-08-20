<?php

namespace App\Policies;

use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class InventoryItemPolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.view');
    }

    public function view(User $user, InventoryItem $item): bool
    {
        return $this->ownsItem($user, $item) && $user->can('inventory.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.manage');
    }

    public function update(User $user, InventoryItem $item): bool
    {
        return $this->ownsItem($user, $item) && $user->can('inventory.manage');
    }

    public function delete(User $user, InventoryItem $item): bool
    {
        return $this->ownsItem($user, $item) && $user->can('inventory.manage');
    }

    private function ownsItem(User $user, InventoryItem $item): bool
    {
        return $this->ownsTenantRecord($user, $item)
            && $this->ownsRelatedRecord($user, InventoryCategory::class, (int) $item->category_id);
    }
}