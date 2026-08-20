<?php

namespace App\Policies;

use App\Models\SalaryStructure;
use App\Models\Staff;
use App\Models\User;
use App\Policies\Concerns\ChecksFinanceTenant;

class SalaryStructurePolicy
{
    use ChecksFinanceTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('payroll.view');
    }

    public function save(User $user, Staff $staff): bool
    {
        return $this->hasTenantContext($user)
            && (int) $staff->school_id === (int) $user->school_id
            && $user->can('payroll.generate');
    }
}
