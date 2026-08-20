<?php

namespace Tests\Support;

use App\Models\School;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesPlatformAdministrationSecurityFixtures
{
    protected function createPlatformAdministrationUser(string $role, ?School $school, array $permissions = []): User
    {
        $user = $this->createSecurityUser($school, [
            'email' => $role . '-' . uniqid() . '@example.test',
        ]);
        $roleModel = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $permissionModels = collect($permissions)->map(fn (string $permission) => Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]));
        $roleModel->syncPermissions($permissionModels);
        $user->assignRole($roleModel);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
