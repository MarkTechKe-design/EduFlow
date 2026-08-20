<?php

namespace App\Policies;

use App\Models\TransportRoute;
use App\Models\User;
use App\Models\Vehicle;
use App\Policies\Concerns\ChecksTransportCommunicationTenant;

class TransportRoutePolicy
{
    use ChecksTransportCommunicationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('transport.view');
    }

    public function view(User $user, TransportRoute $route): bool
    {
        return $this->ownsRoute($user, $route) && $user->can('transport.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('transport.manage');
    }

    public function update(User $user, TransportRoute $route): bool
    {
        return $this->ownsRoute($user, $route) && $user->can('transport.manage');
    }

    public function delete(User $user, TransportRoute $route): bool
    {
        return $this->ownsRoute($user, $route) && $user->can('transport.manage');
    }

    public function assign(User $user, TransportRoute $route): bool
    {
        return $this->ownsRoute($user, $route) && $user->can('transport.manage');
    }

    public function unassign(User $user, TransportRoute $route): bool
    {
        return $this->ownsRoute($user, $route) && $user->can('transport.manage');
    }

    private function ownsRoute(User $user, TransportRoute $route): bool
    {
        return $this->ownsTenantRecord($user, $route)
            && ($route->vehicle_id === null || $this->ownsRecord($user, Vehicle::class, (int) $route->vehicle_id));
    }
}