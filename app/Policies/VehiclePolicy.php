<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vehicle;
use App\Policies\Concerns\ChecksTransportCommunicationTenant;

class VehiclePolicy
{
    use ChecksTransportCommunicationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('transport.view');
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return $this->ownsTenantRecord($user, $vehicle) && $user->can('transport.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('transport.manage');
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        return $this->ownsTenantRecord($user, $vehicle) && $user->can('transport.manage');
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $this->ownsTenantRecord($user, $vehicle) && $user->can('transport.manage');
    }

    public function track(User $user, Vehicle $vehicle): bool
    {
        return $this->ownsTenantRecord($user, $vehicle) && $user->can('transport.manage');
    }
}