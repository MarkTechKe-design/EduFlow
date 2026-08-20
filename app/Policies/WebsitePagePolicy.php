<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WebsitePage;
use App\Policies\Concerns\ChecksPlatformAdministrationTenant;

class WebsitePagePolicy
{
    use ChecksPlatformAdministrationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('website.view');
    }

    public function create(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('website.manage');
    }

    public function update(User $user, WebsitePage $page): bool
    {
        return $this->hasPlatformContext($user) && $user->can('website.manage');
    }

    public function delete(User $user, WebsitePage $page): bool
    {
        return $this->hasPlatformContext($user) && $user->can('website.manage');
    }

    public function publish(User $user, WebsitePage $page): bool
    {
        return $this->hasPlatformContext($user) && $user->can('website.publish');
    }
}
