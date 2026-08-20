<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\AssetMaintenanceLog;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class AssetMaintenanceLogPolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.view');
    }

    public function view(User $user, AssetMaintenanceLog $log): bool
    {
        return $this->ownsLog($user, $log) && $user->can('inventory.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.manage');
    }

    public function update(User $user, AssetMaintenanceLog $log): bool
    {
        return $this->ownsLog($user, $log) && $user->can('inventory.manage');
    }

    public function delete(User $user, AssetMaintenanceLog $log): bool
    {
        return $this->ownsLog($user, $log) && $user->can('inventory.manage');
    }

    private function ownsLog(User $user, AssetMaintenanceLog $log): bool
    {
        return $this->ownsTenantRecord($user, $log)
            && $this->ownsRelatedRecord($user, Asset::class, (int) $log->asset_id);
    }
}