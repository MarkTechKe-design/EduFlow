<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;

class StudentDocumentPolicy
{
    public function view(User $user, StudentDocument $document): bool
    {
        return $this->ownsDocument($user, $document) && $user->can('students.view');
    }

    public function delete(User $user, StudentDocument $document): bool
    {
        return $this->deleteDocument($user, $document);
    }

    public function deleteDocument(User $user, StudentDocument $document): bool
    {
        return $this->ownsDocument($user, $document) && $user->can('students.delete');
    }

    private function ownsDocument(User $user, StudentDocument $document): bool
    {
        return $user->school_id !== null
            && ! $user->hasRole('super-admin')
            && (int) $user->school_id === (int) $document->school_id
            && Student::withoutGlobalScopes()
                ->whereKey($document->student_id)
                ->where('school_id', $user->school_id)
                ->exists();
    }
}
