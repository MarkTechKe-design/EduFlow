<?php

namespace App\Policies;

use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Student;
use App\Models\User;

class FeePaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('fees.view');
    }

    public function view(User $user, FeePayment $payment): bool
    {
        return $this->ownsPayment($user, $payment) && $user->can('fees.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('fees.collect');
    }

    public function collect(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('fees.collect');
    }

    public function outstanding(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('fees.reports');
    }

    private function hasTenantContext(User $user): bool
    {
        return $user->school_id !== null && ! $user->hasRole('super-admin');
    }

    private function ownsPayment(User $user, FeePayment $payment): bool
    {
        if (! $this->hasTenantContext($user) || (int) $payment->school_id !== (int) $user->school_id) {
            return false;
        }

        return Student::withoutGlobalScopes()
                ->whereKey($payment->student_id)
                ->where('school_id', $user->school_id)
                ->exists()
            && FeeStructure::withoutGlobalScopes()
                ->whereKey($payment->fee_structure_id)
                ->where('school_id', $user->school_id)
                ->exists();
    }
}
