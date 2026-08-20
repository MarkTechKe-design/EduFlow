<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\SchoolClass;
use App\Models\User;
use App\Policies\Concerns\ChecksTransportCommunicationTenant;

class AnnouncementPolicy
{
    use ChecksTransportCommunicationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('announcements.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('announcements.create');
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $this->ownsAnnouncement($user, $announcement)
            && ((int) $announcement->author_id === (int) $user->id || $user->can('announcements.delete'))
            && $user->can('announcements.create');
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $this->ownsAnnouncement($user, $announcement) && $user->can('announcements.delete');
    }

    public function broadcast(User $user): bool
    {
        return $this->hasTenantContext($user)
            && ($user->can('sms.send') || $user->can('email.send'));
    }

    public function sendSms(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('sms.send');
    }

    public function sendEmail(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('email.send');
    }

    private function ownsAnnouncement(User $user, Announcement $announcement): bool
    {
        return $this->ownsTenantRecord($user, $announcement)
            && ($announcement->class_id === null || $this->ownsRecord($user, SchoolClass::class, (int) $announcement->class_id));
    }
}