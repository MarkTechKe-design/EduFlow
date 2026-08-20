<?php

namespace App\Policies;

use App\Models\Payroll;
use App\Models\Staff;
use App\Models\User;
use App\Policies\Concerns\ChecksFinanceTenant;

class PayrollPolicy
{
    use ChecksFinanceTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('payroll.view');
    }

    public function generate(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('payroll.generate');
    }

    public function markPaid(User $user, Payroll $payroll): bool
    {
        return $this->ownsPayroll($user, $payroll) && $user->can('payroll.generate');
    }

    public function slip(User $user, Payroll $payroll): bool
    {
        return $this->ownsPayroll($user, $payroll) && $user->can('payslip.download');
    }

    private function ownsPayroll(User $user, Payroll $payroll): bool
    {
        return $this->ownsTenantRecord($user, $payroll)
            && Staff::withoutGlobalScopes()
                ->whereKey($payroll->staff_id)
                ->where('school_id', $user->school_id)
                ->exists();
    }
}
