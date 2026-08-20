<?php

namespace App\Policies;

use App\Models\Staff;
use App\Models\StaffDocument;
use App\Models\User;

class StaffDocumentPolicy
{
    public function view(User $user, StaffDocument $document): bool
    {
        return $this->ownsDocument($user, $document) && $user->can('staff.view');
    }

    public function delete(User $user, StaffDocument $document): bool
    {
        return $this->deleteDocument($user, $document);
    }

    public function deleteDocument(User $user, StaffDocument $document): bool
    {
        return $this->ownsDocument($user, $document) && $user->can('staff.delete');
    }

    private function ownsDocument(User $user, StaffDocument $document): bool
    {
        if ($user->school_id === null || $user->hasRole('super-admin')) {
            return false;
        }

        if ((int) $user->school_id !== (int) $document->school_id) {
            return false;
        }

        return Staff::withoutGlobalScopes()
            ->whereKey($document->staff_id)
            ->where('school_id', $user->school_id)
            ->exists();
    }
}
