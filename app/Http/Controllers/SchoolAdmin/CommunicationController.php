<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailBlast;
use App\Jobs\SendSmsBlast;
use App\Models\Announcement;
use App\Models\EmailTemplate;
use App\Models\Message;
use App\Models\SchoolClass;
use App\Models\SchoolNotification;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CommunicationController extends Controller
{
    // ── Announcements ─────────────────────────────────────────────

    public function announcements(Request $request)
    {
        $this->authorize('viewAny', Announcement::class);

        $sid = $this->getSchoolId();

        $announcements = Announcement::with('author:id,name', 'schoolClass:id,name')
            ->where('school_id', $sid)
            ->when($request->audience, fn ($q) => $q->where('audience', $request->audience))
            ->orderByDesc('is_pinned')
            ->latest('published_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Communication/Announcements', [
            'announcements' => $announcements,
            'classes'       => SchoolClass::where('school_id', $sid)->orderBy('numeric_name')->get(['id', 'name']),
            'filters'       => $request->only('audience'),
        ]);
    }

    public function storeAnnouncement(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'body'        => 'required|string',
            'audience'    => 'required|in:all,class,role',
            'class_id'    => 'nullable|integer',
            'target_role' => 'nullable|string|max:50',
            'is_pinned'   => 'boolean',
            'published_at'=> 'nullable|date',
        ]);

        $sid = $this->getSchoolId();
        $this->assertOptionalClassOwnership($data['class_id'] ?? null, $sid);
        $this->authorize('create', Announcement::class);

        $data['school_id']  = $sid;
        $data['author_id']  = auth()->id();
        $data['published_at'] = $data['published_at'] ?? now();

        Announcement::create($data);
        return back()->with('success', 'Announcement published.');
    }

    public function updateAnnouncement(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'body'        => 'required|string',
            'audience'    => 'required|in:all,class,role',
            'class_id'    => 'nullable|integer',
            'target_role' => 'nullable|string|max:50',
            'is_pinned'   => 'boolean',
            'published_at'=> 'nullable|date',
        ]);

        $sid = $this->getSchoolId();
        $this->assertOptionalClassOwnership($data['class_id'] ?? null, $sid);
        $this->authorize('update', $announcement);

        $announcement->update($data);
        return back()->with('success', 'Announcement updated.');
    }

    public function destroyAnnouncement(Announcement $announcement)
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();
        return back()->with('success', 'Announcement deleted.');
    }

    // ── Messages ──────────────────────────────────────────────────

    public function messages(Request $request)
    {
        $sid  = $this->getSchoolId();
        $this->authorize('viewAny', Message::class);
        $user = auth()->user();

        $inbox = Message::with('sender:id,name')
            ->where('school_id', $sid)
            ->where('recipient_id', $user->id)
            ->latest()
            ->paginate(20, ['*'], 'inbox_page')
            ->withQueryString();

        $sent = Message::with('recipient:id,name')
            ->where('school_id', $sid)
            ->where('sender_id', $user->id)
            ->latest()
            ->paginate(20, ['*'], 'sent_page')
            ->withQueryString();

        $users = User::where('school_id', $sid)
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/Communication/Messages', [
            'inbox'  => $inbox,
            'sent'   => $sent,
            'users'  => $users,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|integer',
            'subject'      => 'nullable|string|max:255',
            'body'         => 'required|string|max:5000',
        ]);

        $sid = $this->getSchoolId();
        $this->assertRecipientOwnership((int) $data['recipient_id'], $sid);
        $draft = new Message([
            'school_id'    => $sid,
            'sender_id'    => auth()->id(),
            'recipient_id' => $data['recipient_id'],
            'subject'      => $data['subject'] ?? null,
            'body'         => $data['body'],
        ]);
        $this->authorize('send', $draft);
        $draft->save();

        return back()->with('success', 'Message sent.');
    }

    public function readMessage(Message $message)
    {
        $this->authorize('read', $message);

        if ($message->recipient_id === auth()->id() && !$message->read_at) {
            $message->update(['read_at' => now()]);
        }
        return back();
    }

    // ── Blast ─────────────────────────────────────────────────────

    public function blast(Request $request)
    {
        $this->authorize('broadcast', Announcement::class);

        $sid = $this->getSchoolId();

        return Inertia::render('SchoolAdmin/Communication/Blast', [
            'classes' => SchoolClass::where('school_id', $sid)->orderBy('numeric_name')->get(['id', 'name']),
        ]);
    }

    public function sendBlast(Request $request)
    {
        $data = $request->validate([
            'channel'    => 'required|in:sms,email',
            'audience'   => 'required|in:all_parents,all_students,all_staff,class',
            'class_id'   => 'nullable|integer',
            'subject'    => 'required_if:channel,email|nullable|string|max:255',
            'message'    => 'required|string|max:1600',
        ]);

        $sid = $this->getSchoolId();
        $this->assertOptionalClassOwnership($data['class_id'] ?? null, $sid);
        $this->authorize($data['channel'] === 'sms' ? 'sendSms' : 'sendEmail', Announcement::class);

        // Build recipient list matching Kenyan primary/secondary school structures
        $recipients = [];
        $phones     = [];

        if ($data['audience'] === 'all_staff') {
            $staff = Staff::where('school_id', $sid)->get(['email', 'phone']);
            $recipients = $staff->pluck('email')->filter()->values()->toArray();
            $phones     = $staff->pluck('phone')->filter()->values()->toArray();
        } elseif ($data['audience'] === 'all_students') {
            $students = Student::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->where('status', 'active')
                ->get(['email', 'phone']);
            $recipients = $students->pluck('email')->filter()->values()->toArray();
            $phones     = $students->pluck('phone')->filter()->values()->toArray();
        } elseif ($data['audience'] === 'class') {
            $students = Student::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->where('status', 'active')
                ->where('class_id', $data['class_id'])
                ->with('guardians:id,email,phone')
                ->get();

            foreach ($students as $student) {
                // Collect Parent/Guardian contacts
                if (!empty($student->guardian_phone)) {
                    $phones[] = $student->guardian_phone;
                }
                foreach ($student->guardians as $g) {
                    if (!empty($g->phone)) $phones[] = $g->phone;
                    if (!empty($g->email)) $recipients[] = $g->email;
                }
            }
        } else {
            // all_parents (default)
            $students = Student::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->where('status', 'active')
                ->with('guardians:id,email,phone')
                ->get();

            foreach ($students as $student) {
                if (!empty($student->guardian_phone)) {
                    $phones[] = $student->guardian_phone;
                }
                foreach ($student->guardians as $g) {
                    if (!empty($g->phone)) $phones[] = $g->phone;
                    if (!empty($g->email)) $recipients[] = $g->email;
                }
            }
        }

        $recipients = array_values(array_unique(array_filter($recipients)));
        $phones     = array_values(array_unique(array_filter($phones)));

        if ($data['channel'] === 'sms') {
            foreach (array_chunk($phones, 100) as $batch) {
                SendSmsBlast::dispatch($batch, $data['message'], $sid);
            }
            $count = count($phones);
        } else {
            foreach (array_chunk($recipients, 100) as $batch) {
                SendEmailBlast::dispatch($batch, $data['subject'], $data['message'], $sid);
            }
            $count = count($recipients);
        }

        return back()->with('success', "Blast queued for {$count} recipient(s).");
    }

    // ── Email Templates ───────────────────────────────────────────

    public function emailTemplates(Request $request)
    {
        $this->authorize('viewAny', EmailTemplate::class);

        $sid = $this->getSchoolId();

        $templates = EmailTemplate::where('school_id', $sid)
            ->orderBy('name')
            ->get();

        return Inertia::render('SchoolAdmin/Communication/EmailTemplates', [
            'templates' => $templates,
        ]);
    }

    public function storeEmailTemplate(Request $request)
    {
        $this->authorize('create', EmailTemplate::class);

        $data = $request->validate([
            'name'      => 'required|string|max:100',
            'slug'      => 'required|string|max:100|alpha_dash',
            'subject'   => 'required|string|max:255',
            'body'      => 'required|string',
            'variables' => 'nullable|array',
            'variables.*' => 'string|max:50',
        ]);

        $data['school_id'] = $this->getSchoolId();
        EmailTemplate::create($data);

        return back()->with('success', 'Template created.');
    }

    public function updateEmailTemplate(Request $request, EmailTemplate $emailTemplate)
    {
        $this->authorize('update', $emailTemplate);

        $data = $request->validate([
            'name'      => 'required|string|max:100',
            'subject'   => 'required|string|max:255',
            'body'      => 'required|string',
            'variables' => 'nullable|array',
            'variables.*' => 'string|max:50',
            'is_active' => 'boolean',
        ]);

        $emailTemplate->update($data);
        return back()->with('success', 'Template updated.');
    }

    // ── Notifications ─────────────────────────────────────────────

    public function notifications(Request $request)
    {
        $notifications = SchoolNotification::where('user_id', auth()->id())
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Communication/Notifications', [
            'notifications' => $notifications,
            'unread_count'  => SchoolNotification::where('user_id', auth()->id())->whereNull('read_at')->count(),
        ]);
    }

    public function markNotificationRead(SchoolNotification $notification)
    {
        if ($notification->user_id === auth()->id()) {
            $notification->markRead();
        }
        return back();
    }

    public function markAllNotificationsRead()
    {
        SchoolNotification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }
    private function assertOptionalClassOwnership($classId, int $schoolId): void
    {
        if ($classId !== null) {
            abort_unless(
                SchoolClass::query()->whereKey((int) $classId)->where('school_id', $schoolId)->exists(),
                404
            );
        }
    }

    private function assertRecipientOwnership(int $recipientId, int $schoolId): void
    {
        abort_unless(
            User::withoutGlobalScopes()->whereKey($recipientId)->where('school_id', $schoolId)->exists(),
            404
        );
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? abort(403, 'Tenant access denied: No valid school context.'))->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}

