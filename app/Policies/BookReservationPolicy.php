<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\BookReservation;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class BookReservationPolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('library.view');
    }

    public function view(User $user, BookReservation $reservation): bool
    {
        return $this->ownsReservation($user, $reservation) && $user->can('library.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('library.issue');
    }

    public function update(User $user, BookReservation $reservation): bool
    {
        return $this->ownsReservation($user, $reservation) && $user->can('library.issue');
    }

    public function delete(User $user, BookReservation $reservation): bool
    {
        return $this->ownsReservation($user, $reservation) && $user->can('library.issue');
    }

    private function ownsReservation(User $user, BookReservation $reservation): bool
    {
        if (! $this->ownsTenantRecord($user, $reservation)
            || ! $this->ownsRelatedRecord($user, Book::class, (int) $reservation->book_id)) {
            return false;
        }

        $memberClass = match ($reservation->member_type) {
            Student::class, 'student' => Student::class,
            Staff::class, 'staff' => Staff::class,
            default => null,
        };

        return $memberClass !== null
            && $this->ownsRelatedRecord($user, $memberClass, (int) $reservation->member_id);
    }
}