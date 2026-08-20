<?php

namespace App\Policies;

use App\Models\EmailTemplate;
use App\Models\User;
use App\Policies\Concerns\ChecksTransportCommunicationTenant;

class EmailTemplatePolicy
{
    use ChecksTransportCommunicationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('email.send');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('email.send');
    }

    public function update(User $user, EmailTemplate $template): bool
    {
        return $this->ownsTenantRecord($user, $template) && $user->can('email.send');
    }
}