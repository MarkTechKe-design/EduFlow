<?php

namespace App\Http\Controllers;

use App\Models\OnlineClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VirtualClassroomController extends Controller
{
    public function join(Request $request, OnlineClass $onlineClass): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        if ((int) $onlineClass->school_id !== (int) $user->school_id) {
            abort(404, 'Classroom session not found.');
        }

        if (! $onlineClass->canUserJoin($user)) {
            abort(403, 'Unauthorized: Access restricted to assigned participants.');
        }

        if ($onlineClass->status === 'cancelled') {
            abort(410, 'This session has been cancelled by the organizer.');
        }

        $isHost = $user->hasRole(['super-admin', 'school-admin', 'principal'])
            || (int) $onlineClass->teacher_id === (int) $user->id
            || (int) $onlineClass->created_by === (int) $user->id;

        if ($isHost && $onlineClass->status === 'scheduled') {
            $onlineClass->update([
                'status'     => 'live',
                'started_at' => now(),
            ]);
        }

        $onlineClass->load([
            'school:id,name',
            'class:id,name',
            'section:id,name',
            'subject:id,name',
            'teacher:id,name',
        ]);

        $fullName = trim($user->name ?: ($user->email ?? 'Participant'));
        $rolePrefix = match(true) {
            $isHost => 'Host',
            $user->hasRole(['parent', 'guardian']) => 'Parent',
            $user->hasRole('student') => 'Student',
            default => 'Participant',
        };
        $displayName = "{$rolePrefix}: {$fullName}";

        $audienceLabel = match($onlineClass->meeting_type) {
            'parent_grade'   => ($onlineClass->class?->name ?? 'Grade') . ' Parents Consultation',
            'parent_general' => 'Annual General Meeting / Briefing',
            'staff'          => 'Staff & Administration Meeting',
            'board'          => 'Board of Management (BOM)',
            default          => ($onlineClass->class?->name ?? 'Class') . ' Academic Session',
        };

        $encodedName = rawurlencode($displayName);
        $encodedSubject = rawurlencode("{$onlineClass->title} | {$audienceLabel}");

        $meetingUrl = "https://meet.ffmuc.net/{$onlineClass->meeting_id}"
            . "#userInfo.displayName=\"{$encodedName}\""
            . "&config.subject=\"{$encodedSubject}\""
            . "&config.prejoinPageEnabled=false"
            . "&config.enableWelcomePage=false"
            . "&config.enableClosePage=false"
            . "&config.disableDeepLinking=true"
            . "&config.feedbackPercentage=0"
            . "&config.hideConferenceSubject=false"
            . "&config.startWithAudioMuted=" . ($isHost ? 'false' : 'true');

        return Inertia::render('VirtualClassroom/Room', [
            'session' => [
                'id'               => $onlineClass->id,
                'title'            => $onlineClass->title,
                'meeting_type'     => $onlineClass->meeting_type ?? 'classroom',
                'audience_label'   => $audienceLabel,
                'description'      => $onlineClass->description,
                'status'           => $onlineClass->status,
                'scheduled_at'     => $onlineClass->scheduled_at?->toIso8601String(),
                'duration_minutes' => $onlineClass->duration_minutes,
                'school_name'      => $onlineClass->school?->name ?? 'Institution',
                'class_name'       => $onlineClass->class?->name,
                'section_name'     => $onlineClass->section?->name,
                'subject_name'     => $onlineClass->subject?->name,
                'host_name'        => $onlineClass->teacher?->name ?? 'School Administration',
            ],
            'client' => [
                'meetingUrl'  => $meetingUrl,
                'roomName'    => $onlineClass->meeting_id,
                'displayName' => $displayName,
                'isHost'      => $isHost,
                'returnUrl'   => route('school.online-classes.index'),
            ],
        ]);
    }
}