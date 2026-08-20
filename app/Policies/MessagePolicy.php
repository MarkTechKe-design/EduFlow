<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;
use App\Policies\Concerns\ChecksTransportCommunicationTenant;

class MessagePolicy
{
    use ChecksTransportCommunicationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('messages.view');
    }

    public function send(User $user, Message $message): bool
    {
        return $this->ownsDraft($user, $message) && $user->can('messages.send');
    }

    public function read(User $user, Message $message): bool
    {
        return $this->ownsTenantRecord($user, $message)
            && (int) $message->recipient_id === (int) $user->id
            && $user->can('messages.view');
    }

    private function ownsDraft(User $user, Message $message): bool
    {
        return $this->hasTenantContext($user)
            && (int) $message->school_id === (int) $user->school_id
            && $this->ownsRecord($user, User::class, (int) $message->recipient_id);
    }
}