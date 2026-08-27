<?php

namespace App\Policies;

use App\Models\FeeCategory;
use App\Models\User;
use App\Policies\Concerns\ChecksFinanceTenant;

class FeeCategoryPolicy
{
    use ChecksFinanceTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('fees.structure');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('fees.structure');
    }

    public function view(User $user, FeeCategory $category): bool
    {
        return $this->ownsTenantRecord($user, $category) && $user->can('fees.structure');
    }

    public function update(User $user, FeeCategory $category): bool
    {
        return $this->ownsTenantRecord($user, $category) && $user->can('fees.structure');
    }

    public function delete(User $user, FeeCategory $category): bool
    {
        return $this->ownsTenantRecord($user, $category) && $user->can('fees.structure');
    }
}
