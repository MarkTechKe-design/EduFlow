<?php

namespace App\Policies;

use App\Models\Hostel;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\Student;
use App\Models\User;
use App\Policies\Concerns\ChecksOperationsTenant;

class HostelAllocationPolicy
{
    use ChecksOperationsTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('hostel.view');
    }

    public function create(User $user, array $data): bool
    {
        if (! $this->hasTenantContext($user)
            || ! $this->ownsRelatedRecord($user, Hostel::class, (int) $data['hostel_id'])
            || ! $this->ownsRelatedRecord($user, HostelRoom::class, (int) $data['room_id'])
            || ! $this->ownsRelatedRecord($user, Student::class, (int) $data['student_id'])) {
            return false;
        }

        $room = HostelRoom::withoutGlobalScopes()
            ->whereKey((int) $data['room_id'])
            ->where('school_id', $user->school_id)
            ->where('hostel_id', (int) $data['hostel_id'])
            ->first();

        return $room !== null
            && (int) $room->hostel_id === (int) $data['hostel_id']
            && $user->can('hostel.manage');
    }

    public function vacate(User $user, HostelAllocation $allocation): bool
    {
        return $this->ownsTenantRecord($user, $allocation) && $user->can('hostel.manage');
    }
}
