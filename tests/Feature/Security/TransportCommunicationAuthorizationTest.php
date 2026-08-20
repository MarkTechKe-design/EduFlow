<?php

namespace Tests\Feature\Security;

use Tests\Support\CreatesTransportCommunicationSecurityFixtures;
use Tests\Support\SecurityTestCase;

class TransportCommunicationAuthorizationTest extends SecurityTestCase
{
    use CreatesTransportCommunicationSecurityFixtures;

    public function test_guests_cannot_access_transport_or_communication_workflows(): void
    {
        foreach ([
            '/school/transport/vehicles', '/school/transport/routes',
            '/school/communication/announcements', '/school/communication/messages',
            '/school/communication/blast', '/school/communication/email-templates',
            '/school/communication/notifications',
        ] as $uri) {
            $this->get($uri)->assertRedirect(route('login'));
        }
    }

    public function test_school_admin_can_use_same_tenant_transport_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createTransportCommunicationUser('school-admin', $school, ['transport.view', 'transport.manage']);
        $vehicle = $this->createTransportVehicle($school);
        $route = $this->createTransportRoute($school, $vehicle);
        $student = $this->createTransportStudent($school);

        $this->actingAs($admin)->get('/school/transport/vehicles')->assertOk();
        $this->actingAs($admin)->get('/school/transport/routes')->assertOk();
        $this->actingAs($admin)->get('/school/transport/routes/' . $route->id . '/assignments')->assertOk();
        $this->actingAs($admin)->post('/school/transport/vehicles', [
            'registration_no' => 'NEW-' . uniqid(), 'type' => 'bus', 'capacity' => 30,
        ])->assertRedirect();
        $this->actingAs($admin)->post('/school/transport/routes', [
            'name' => 'New Route', 'vehicle_id' => $vehicle->id,
        ])->assertRedirect();
        $this->actingAs($admin)->post('/school/transport/routes/' . $route->id . '/assign', [
            'student_id' => $student->id, 'stop' => 'Stop 1',
        ])->assertRedirect();
        $this->actingAs($admin)->delete('/school/transport/routes/' . $route->id . '/students/' . $student->id)->assertRedirect();
        $this->actingAs($admin)->put('/school/transport/vehicles/' . $vehicle->id, [
            'registration_no' => $vehicle->registration_no, 'type' => 'bus', 'capacity' => 40, 'status' => 'maintenance',
        ])->assertRedirect();
    }

    public function test_school_admin_can_use_same_tenant_communication_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createTransportCommunicationUser('school-admin', $school, [
            'announcements.view', 'announcements.create', 'announcements.delete',
            'messages.view', 'messages.send', 'sms.send', 'email.send',
        ]);
        $recipient = $this->createTransportCommunicationUser('teacher', $school);
        $class = $this->createTransportClass($school);
        $announcement = $this->createAnnouncement($school, $admin, $class);
        $message = $this->createMessage($school, $recipient, $admin);
        $template = $this->createEmailTemplate($school);

        $this->actingAs($admin)->get('/school/communication/announcements')->assertOk();
        $this->actingAs($admin)->get('/school/communication/messages')->assertOk();
        $this->actingAs($admin)->get('/school/communication/blast')->assertOk();
        $this->actingAs($admin)->get('/school/communication/email-templates')->assertOk();
        $this->actingAs($admin)->put('/school/communication/announcements/' . $announcement->id, [
            'title' => 'Updated', 'body' => 'Updated body', 'audience' => 'class', 'class_id' => $class->id,
        ])->assertRedirect();
        $this->actingAs($admin)->post('/school/communication/announcements', [
            'title' => 'Created', 'body' => 'Created body', 'audience' => 'all',
        ])->assertRedirect();
        $this->actingAs($admin)->delete('/school/communication/announcements/' . $announcement->id)->assertRedirect();
        $this->actingAs($admin)->post('/school/communication/messages', [
            'recipient_id' => $recipient->id, 'subject' => 'Hello', 'body' => 'Message body',
        ])->assertRedirect();
        $this->actingAs($admin)->put('/school/communication/messages/' . $message->id . '/read')->assertRedirect();
        $this->actingAs($admin)->post('/school/communication/blast', [
            'channel' => 'sms', 'audience' => 'all_students', 'message' => 'Reminder',
        ])->assertRedirect();
        $this->actingAs($admin)->put('/school/communication/email-templates/' . $template->id, [
            'name' => 'Updated Template', 'subject' => 'Updated', 'body' => 'Updated body',
        ])->assertRedirect();
    }

    public function test_roles_without_matching_permissions_are_denied_and_driver_fails_closed(): void
    {
        $school = $this->createSecuritySchool();
        $cases = [
            ['teacher', '/school/transport/vehicles'],
            ['accountant', '/school/communication/announcements'],
            ['librarian', '/school/communication/messages'],

            ['student', '/school/communication/messages'],
            ['parent', '/school/communication/announcements'],
        ];

        foreach ($cases as [$role, $uri]) {
            $user = $this->createTransportCommunicationUser($role, $school);
            $this->actingAs($user)->get($uri)->assertForbidden();
        }
    }

    public function test_driver_can_view_same_school_transport_workspace_without_management_access(): void
    {
        $school = $this->createSecuritySchool();
        $vehicle = $this->createTransportVehicle($school);
        $driver = $this->createTransportCommunicationUser('driver', $school, ['transport.view', 'transport.attendance']);

        $this->actingAs($driver)->get('/school/transport/vehicles')->assertOk();
        $this->actingAs($driver)->get('/school/transport/routes')->assertOk();
        $this->actingAs($driver)->put('/school/transport/vehicles/' . $vehicle->id, [
            'registration_no' => 'Denied', 'type' => 'bus', 'capacity' => 10, 'status' => 'active',
        ])->assertForbidden();
    }
    public function test_cross_tenant_transport_and_communication_records_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createTransportCommunicationUser('school-admin', $schoolA, [
            'transport.view', 'transport.manage', 'announcements.view', 'announcements.create', 'announcements.delete',
            'messages.view', 'messages.send', 'email.send',
        ]);
        $vehicleB = $this->createTransportVehicle($schoolB);
        $routeB = $this->createTransportRoute($schoolB, $vehicleB);
        $studentB = $this->createTransportStudent($schoolB);
        $classB = $this->createTransportClass($schoolB);
        $announcementB = $this->createAnnouncement($schoolB, $admin, $classB);
        $recipientB = $this->createTransportCommunicationUser('teacher', $schoolB);
        $messageB = $this->createMessage($schoolB, $recipientB, $admin);
        $templateB = $this->createEmailTemplate($schoolB);

        $this->actingAs($admin)->put('/school/transport/vehicles/' . $vehicleB->id, [
            'registration_no' => 'Denied', 'type' => 'bus', 'capacity' => 10, 'status' => 'active',
        ])->assertNotFound();
        $this->actingAs($admin)->get('/school/transport/routes/' . $routeB->id . '/assignments')->assertNotFound();
        $this->actingAs($admin)->post('/school/transport/routes', ['name' => 'Denied', 'vehicle_id' => $vehicleB->id])->assertNotFound();
        $routeA = $this->createTransportRoute($schoolA);
        $this->actingAs($admin)->post('/school/transport/routes/' . $routeA->id . '/assign', ['student_id' => $studentB->id])->assertNotFound();
        $this->actingAs($admin)->put('/school/communication/announcements/' . $announcementB->id, ['title' => 'Denied', 'body' => 'Denied', 'audience' => 'all'])->assertNotFound();
        $this->actingAs($admin)->put('/school/communication/messages/' . $messageB->id . '/read')->assertNotFound();
        $this->actingAs($admin)->post('/school/communication/messages', ['recipient_id' => $recipientB->id, 'body' => 'Denied'])->assertNotFound();
        $this->actingAs($admin)->put('/school/communication/email-templates/' . $templateB->id, ['name' => 'Denied', 'subject' => 'Denied', 'body' => 'Denied'])->assertNotFound();
    }

    public function test_suspended_deleted_and_super_admin_tenants_fail_closed(): void
    {
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $suspendedUser = $this->createTransportCommunicationUser('school-admin', $suspended, ['transport.view']);
        $this->actingAs($suspendedUser)->get('/school/transport/vehicles')->assertForbidden();

        $deleted = $this->createSecuritySchool();
        $deletedUser = $this->createTransportCommunicationUser('principal', $deleted, ['announcements.view']);
        $deleted->delete();
        $this->actingAs($deletedUser)->get('/school/communication/announcements')->assertForbidden();

        $superAdmin = $this->createTransportCommunicationUser('super-admin', null, ['transport.view', 'announcements.view']);
        $this->actingAs($superAdmin)->get('/school/transport/vehicles')->assertForbidden();
        $this->actingAs($superAdmin)->get('/school/communication/announcements')->assertForbidden();
    }

    public function test_client_school_id_and_cross_tenant_class_cannot_override_ownership(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createTransportCommunicationUser('school-admin', $schoolA, ['transport.manage', 'announcements.create', 'announcements.view']);
        $classB = $this->createTransportClass($schoolB);

        $this->actingAs($admin)->post('/school/transport/vehicles', [
            'school_id' => $schoolB->id, 'registration_no' => 'Owned', 'type' => 'bus', 'capacity' => 10,
        ])->assertRedirect();
        $this->assertDatabaseHas('vehicles', ['registration_no' => 'Owned', 'school_id' => $schoolA->id]);
        $this->actingAs($admin)->post('/school/communication/announcements', [
            'school_id' => $schoolB->id, 'title' => 'Denied Class', 'body' => 'Denied', 'audience' => 'class', 'class_id' => $classB->id,
        ])->assertNotFound();
    }
}