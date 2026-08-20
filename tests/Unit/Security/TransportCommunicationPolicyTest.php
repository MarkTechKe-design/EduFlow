<?php

namespace Tests\Unit\Security;

use App\Models\Announcement;
use App\Models\EmailTemplate;
use App\Models\Message;
use App\Models\TransportRoute;
use App\Models\Vehicle;
use App\Policies\AnnouncementPolicy;
use App\Policies\EmailTemplatePolicy;
use App\Policies\MessagePolicy;
use App\Policies\TransportRoutePolicy;
use App\Policies\VehiclePolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesTransportCommunicationSecurityFixtures;
use Tests\Support\SecurityTestCase;

class TransportCommunicationPolicyTest extends SecurityTestCase
{
    use CreatesTransportCommunicationSecurityFixtures;

    public function test_transport_and_communication_policies_are_registered(): void
    {
        $this->assertInstanceOf(VehiclePolicy::class, Gate::getPolicyFor(Vehicle::class));
        $this->assertInstanceOf(TransportRoutePolicy::class, Gate::getPolicyFor(TransportRoute::class));
        $this->assertInstanceOf(AnnouncementPolicy::class, Gate::getPolicyFor(Announcement::class));
        $this->assertInstanceOf(MessagePolicy::class, Gate::getPolicyFor(Message::class));
        $this->assertInstanceOf(EmailTemplatePolicy::class, Gate::getPolicyFor(EmailTemplate::class));
    }

    public function test_existing_permissions_map_to_transport_and_communication_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $transportUser = $this->createTransportCommunicationUser('school-admin', $school, ['transport.view', 'transport.manage']);
        $communicationUser = $this->createTransportCommunicationUser('principal', $school, ['announcements.view', 'announcements.create', 'announcements.delete', 'messages.view', 'messages.send', 'email.send', 'sms.send']);
        $recipient = $this->createTransportCommunicationUser('teacher', $school);
        $vehicle = $this->createTransportVehicle($school);
        $route = $this->createTransportRoute($school, $vehicle);
        $announcement = $this->createAnnouncement($school, $communicationUser);
        $template = $this->createEmailTemplate($school);
        $draft = new Message(['school_id' => $school->id, 'sender_id' => $communicationUser->id, 'recipient_id' => $recipient->id, 'body' => 'Body']);

        $this->assertTrue(Gate::forUser($transportUser)->allows('viewAny', Vehicle::class));
        $this->assertTrue(Gate::forUser($transportUser)->allows('update', $vehicle));
        $this->assertTrue(Gate::forUser($transportUser)->allows('assign', $route));
        $this->assertTrue(Gate::forUser($communicationUser)->allows('viewAny', Announcement::class));
        $this->assertTrue(Gate::forUser($communicationUser)->allows('update', $announcement));
        $this->assertTrue(Gate::forUser($communicationUser)->allows('send', $draft));
        $this->assertTrue(Gate::forUser($communicationUser)->allows('update', $template));
        $this->assertTrue(Gate::forUser($communicationUser)->allows('sendSms', Announcement::class));
        $this->assertTrue(Gate::forUser($communicationUser)->allows('sendEmail', Announcement::class));
    }

    public function test_cross_tenant_records_and_related_records_fail_closed(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $userA = $this->createTransportCommunicationUser('school-admin', $schoolA, ['transport.view', 'transport.manage', 'announcements.view', 'announcements.create', 'announcements.delete', 'messages.view', 'messages.send', 'email.send']);
        $vehicleB = $this->createTransportVehicle($schoolB);
        $routeB = $this->createTransportRoute($schoolB, $vehicleB);
        $authorB = $this->createTransportCommunicationUser('teacher', $schoolB);
        $announcementB = $this->createAnnouncement($schoolB, $authorB);
        $recipientB = $this->createTransportCommunicationUser('principal', $schoolB);
        $draft = new Message(['school_id' => $schoolA->id, 'sender_id' => $userA->id, 'recipient_id' => $recipientB->id, 'body' => 'Body']);

        $this->assertFalse(Gate::forUser($userA)->allows('update', $vehicleB));
        $this->assertFalse(Gate::forUser($userA)->allows('update', $routeB));
        $this->assertFalse(Gate::forUser($userA)->allows('update', $announcementB));
        $this->assertFalse(Gate::forUser($userA)->allows('send', $draft));
    }

    public function test_missing_suspended_and_super_admin_contexts_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        $vehicle = $this->createTransportVehicle($school);
        $missing = $this->createTransportCommunicationUser('school-admin', null, ['transport.view']);
        $suspendedSchool = $this->createSecuritySchool(['status' => 'suspended']);
        $suspended = $this->createTransportCommunicationUser('principal', $suspendedSchool, ['announcements.view']);
        $superAdmin = $this->createTransportCommunicationUser('super-admin', null, ['transport.view', 'announcements.view']);

        $this->assertFalse(Gate::forUser($missing)->allows('view', $vehicle));
        $this->assertFalse(Gate::forUser($suspended)->allows('viewAny', Announcement::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('viewAny', Vehicle::class));
    }

    public function test_driver_can_view_transport_records_but_cannot_manage_them_without_assignment(): void
    {
        $school = $this->createSecuritySchool();
        $driver = $this->createTransportCommunicationUser('driver', $school, ['transport.view', 'transport.attendance']);
        $vehicle = $this->createTransportVehicle($school);

        $this->assertTrue(Gate::forUser($driver)->allows('view', $vehicle));
        $this->assertTrue(Gate::forUser($driver)->allows('viewAny', Vehicle::class));
        $this->assertFalse(Gate::forUser($driver)->allows('update', $vehicle));
    }
}