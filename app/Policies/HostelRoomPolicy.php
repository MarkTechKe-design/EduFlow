<?php

namespace App\Policies;

use App\Models\Hostel;
use App\Models\HostelRoom;
use App\Models\User;
use App\Policies\Concerns\ChecksOperationsTenant;

class HostelRoomPolicy
{
    use ChecksOperationsTenant;

    public function viewAny(User $user, ?Hostel $hostel = null): bool
    {
        return ($hostel === null ? $this->hasTenantContext($user) : $this->ownsTenantRecord($user, $hostel))
            && $user->can('hostel.view');
    }

    public function create(User $user, Hostel $hostel): bool
    {
        return $this->ownsTenantRecord($user, $hostel) && $user->can('hostel.manage');
    }

    public function update(User $user, HostelRoom $room, Hostel $hostel): bool
    {
        return $this->ownsTenantRecord($user, $room)
            && $this->ownsTenantRecord($user, $hostel)
            && (int) $room->hostel_id === (int) $hostel->id
            && $user->can('hostel.manage');
    }

    public function delete(User $user, HostelRoom $room, Hostel $hostel): bool
    {
        return $this->update($user, $room, $hostel);
    }
}
