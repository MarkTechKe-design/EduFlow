<?php

namespace App\Policies;

use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class InventoryPurchasePolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.view');
    }

    public function view(User $user, InventoryPurchase $purchase): bool
    {
        return $this->ownsPurchase($user, $purchase) && $user->can('inventory.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user)
            && ($user->can('inventory.manage') || $user->can('expenses.create'));
    }

    private function ownsPurchase(User $user, InventoryPurchase $purchase): bool
    {
        return $this->ownsTenantRecord($user, $purchase)
            && $this->ownsRelatedRecord($user, InventoryItem::class, (int) $purchase->item_id);
    }
}