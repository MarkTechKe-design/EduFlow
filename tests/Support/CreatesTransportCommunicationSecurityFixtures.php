<?php

namespace Tests\Support;

use App\Models\Announcement;
use App\Models\EmailTemplate;
use App\Models\Message;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolNotification;
use App\Models\Staff;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\User;
use App\Models\Vehicle;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesTransportCommunicationSecurityFixtures
{
    protected function createTransportCommunicationUser(string $role, ?School $school, array $permissions = []): User
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

    protected function createTransportVehicle(School $school): Vehicle
    {
        return Vehicle::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'registration_no' => 'SEC-' . uniqid(),
            'name' => 'Security Bus',
            'type' => 'bus',
            'capacity' => 40,
            'status' => 'active',
        ]);
    }

    protected function createTransportRoute(School $school, ?Vehicle $vehicle = null): TransportRoute
    {
        return TransportRoute::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'vehicle_id' => $vehicle?->id,
            'name' => 'Security Route ' . uniqid(),
            'start_point' => 'Start',
            'end_point' => 'End',
            'stops' => [['name' => 'Stop 1', 'pickup_time' => '07:00']],
            'monthly_fee' => 100,
            'is_active' => true,
        ]);
    }

    protected function createTransportClass(School $school): SchoolClass
    {
        return SchoolClass::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Transport Class ' . uniqid(),
            'numeric_name' => 1,
        ]);
    }

    protected function createTransportStudent(School $school, ?SchoolClass $class = null): Student
    {
        $class ??= $this->createTransportClass($school);

        return Student::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'first_name' => 'Transport',
            'last_name' => 'Student',
            'gender' => 'other',
            'category' => 'general',
            'status' => 'active',
        ]);
    }

    protected function createAnnouncement(School $school, User $author, ?SchoolClass $class = null): Announcement
    {
        return Announcement::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'author_id' => $author->id,
            'title' => 'Security Announcement',
            'body' => 'Security announcement body.',
            'audience' => $class ? 'class' : 'all',
            'class_id' => $class?->id,
            'published_at' => now(),
        ]);
    }

    protected function createMessage(School $school, User $sender, User $recipient): Message
    {
        return Message::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'subject' => 'Security message',
            'body' => 'Security message body.',
        ]);
    }

    protected function createEmailTemplate(School $school): EmailTemplate
    {
        return EmailTemplate::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Security Template',
            'slug' => 'security-' . uniqid(),
            'subject' => 'Subject',
            'body' => 'Body',
            'variables' => [],
            'is_active' => true,
        ]);
    }

    protected function createSchoolNotification(School $school, User $recipient): SchoolNotification
    {
        return SchoolNotification::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'user_id' => $recipient->id,
            'type' => 'security',
            'title' => 'Security notification',
            'body' => 'Security notification body.',
            'channel' => 'in-app',
        ]);
    }
}