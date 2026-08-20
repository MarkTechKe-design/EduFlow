<?php

namespace App\Policies;

use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\User;
use App\Policies\Concerns\ChecksFinanceTenant;

class FeeStructurePolicy
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

    public function update(User $user, FeeStructure $structure): bool
    {
        return $this->ownsStructure($user, $structure) && $user->can('fees.structure');
    }

    public function delete(User $user, FeeStructure $structure): bool
    {
        return $this->ownsStructure($user, $structure) && $user->can('fees.structure');
    }

    private function ownsStructure(User $user, FeeStructure $structure): bool
    {
        return $this->ownsTenantRecord($user, $structure)
            && SchoolClass::withoutGlobalScopes()
                ->whereKey($structure->class_id)
                ->where('school_id', $user->school_id)
                ->exists()
            && FeeCategory::withoutGlobalScopes()
                ->whereKey($structure->fee_category_id)
                ->where('school_id', $user->school_id)
                ->exists();
    }
}
