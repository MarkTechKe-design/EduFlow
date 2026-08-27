<?php

use App\Models\User;
use App\Support\Authorization\ModuleAccessService;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('cocurricular-school.{schoolId}', function (User $user, int $schoolId) {
    // 1. Tenant boundary enforcement
    if ((int) $user->school_id !== (int) $schoolId) {
        return false;
    }

    // 2. Module gating enforcement
    if (!app(ModuleAccessService::class)->isEnabledForUser($user, 'cocurricular')) {
        return false;
    }

    // 3. Capability authorization (Staff/Coach roles or Co-Curricular permissions)
    return $user->can('activities.results')
        || $user->can('activities.manage')
        || $user->can('activities.view')
        || $user->hasRole(['school-admin', 'principal', 'teacher']);
});