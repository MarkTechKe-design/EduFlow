<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\User;
use App\Policies\Concerns\ChecksLibraryInventoryTenant;

class BookPolicy
{
    use ChecksLibraryInventoryTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('library.view');
    }

    public function view(User $user, Book $book): bool
    {
        return $this->ownsTenantRecord($user, $book) && $user->can('library.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('library.manage');
    }

    public function update(User $user, Book $book): bool
    {
        return $this->ownsTenantRecord($user, $book) && $user->can('library.manage');
    }

    public function delete(User $user, Book $book): bool
    {
        return $this->ownsTenantRecord($user, $book) && $user->can('library.manage');
    }
}