<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\InventoryIssue;
use App\Models\InventoryItem;
use App\Models\Staff;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class InventoryIssuePolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.view');
    }

    public function view(User $user, InventoryIssue $issue): bool
    {
        return $this->ownsIssue($user, $issue) && $user->can('inventory.view');
    }

    public function issue(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('inventory.issue');
    }

    public function return(User $user, InventoryIssue $issue): bool
    {
        return $this->ownsIssue($user, $issue) && $user->can('inventory.issue');
    }

    private function ownsIssue(User $user, InventoryIssue $issue): bool
    {
        if (! $this->ownsTenantRecord($user, $issue)
            || ! $this->ownsRelatedRecord($user, InventoryItem::class, (int) $issue->item_id)) {
            return false;
        }

        $modelClass = match ($issue->issued_to_type) {
            'staff' => Staff::class,
            'department' => Department::class,
            default => null,
        };

        return $modelClass !== null
            && $this->ownsRelatedRecord($user, $modelClass, (int) $issue->issued_to_id);
    }
}