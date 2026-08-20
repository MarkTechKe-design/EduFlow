<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\BookIssue;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class BookIssuePolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('library.view');
    }

    public function view(User $user, BookIssue $issue): bool
    {
        return $this->ownsIssue($user, $issue) && $user->can('library.view');
    }

    public function issue(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('library.issue');
    }

    public function return(User $user, BookIssue $issue): bool
    {
        return $this->ownsIssue($user, $issue) && $user->can('library.issue');
    }

    private function ownsIssue(User $user, BookIssue $issue): bool
    {
        return $this->ownsTenantRecord($user, $issue)
            && $this->ownsRelatedRecord($user, Book::class, (int) $issue->book_id)
            && $this->ownsMember($user, $issue);
    }

    private function ownsMember(User $user, BookIssue $issue): bool
    {
        $memberClass = match ($issue->member_type) {
            Student::class, 'student' => Student::class,
            Staff::class, 'staff' => Staff::class,
            default => null,
        };

        return $memberClass !== null
            && $this->ownsRelatedRecord($user, $memberClass, (int) $issue->member_id);
    }
}