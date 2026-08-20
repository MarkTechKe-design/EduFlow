<?php

namespace App\Policies;

use App\Policies\Concerns\ChecksFinanceTenant;
use App\Models\User;

class FinanceReportPolicy
{
    use ChecksFinanceTenant;

    public function view(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('reports.view');
    }

    public function custom(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('reports.custom');
    }

    public function export(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('reports.export');
    }
}
