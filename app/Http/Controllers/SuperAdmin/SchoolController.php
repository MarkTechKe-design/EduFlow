<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\SchoolRequest;
use App\Models\School;
use App\Models\User;
use App\Mail\SchoolVerifiedMail;
use App\Mail\SchoolVerificationRejectedMail;
use App\Mail\SchoolSuspendedMail;
use App\Mail\SchoolActivatedMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'active', 'role:super-admin']);
    }

    public function index(Request $request): Response
    {
        $schools = School::query()
            ->withCount('users')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('slug', 'like', "%{$s}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->verification_status, fn ($q, $v) => $q->where('verification_status', $v))
            ->latest()
            ->paginate(15)
            ->withQueryString();

                $stats = [
            'total'     => School::count(),
            'active'    => School::where('status', 'active')->count(),
            'suspended' => School::where('status', 'suspended')->count(),
        ];

                $stats = [
            'total'     => School::count(),
            'active'    => School::where('status', 'active')->count(),
            'suspended' => School::where('status', 'suspended')->count(),
        ];

                $stats = [
            'total'     => School::count(),
            'active'    => School::where('status', 'active')->count(),
            'suspended' => School::where('status', 'suspended')->count(),
        ];

        return Inertia::render('SuperAdmin/Schools/Index', [
            'schools' => [
                'data'  => $schools->items(),
                'links' => $schools->linkCollection()->toArray(),
                'meta'  => [
                    'current_page' => $schools->currentPage(),
                    'last_page'    => $schools->lastPage(),
                    'per_page'     => $schools->perPage(),
                    'total'        => $schools->total(),
                    'from'         => $schools->firstItem(),
                    'to'           => $schools->lastItem(),
                ],
                'current_page' => $schools->currentPage(),
                'last_page'    => $schools->lastPage(),
                'per_page'     => $schools->perPage(),
                'total'        => $schools->total(),
            ],
            'filters' => $request->only(['search', 'status', 'verification_status']),
            'stats'   => $stats,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SuperAdmin/Schools/Create');
    }

    public function store(SchoolRequest $request): RedirectResponse
    {
        $school = School::create($request->validated());

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('School created');
        }

        return redirect()->route('super-admin.schools.index')
            ->with('success', "School \"{$school->name}\" created successfully.");
    }

    public function show(School $school): Response
    {
        $school->load(['academicYears', 'verifiedByUser']);
        $school->loadCount('users');

        return Inertia::render('SuperAdmin/Schools/Show', [
            'school' => $school,
        ]);
    }

    public function edit(School $school): Response
    {
        return Inertia::render('SuperAdmin/Schools/Edit', [
            'school' => $school,
        ]);
    }

    public function update(SchoolRequest $request, School $school): RedirectResponse
    {
        $school->update($request->validated());

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('School updated');
        }

        return redirect()->route('super-admin.schools.show', $school->id)
            ->with('success', "School \"{$school->name}\" updated.");
    }

    public function suspend(Request $request, School $school): RedirectResponse
    {
        $this->authorize('suspend', $school);
        $school->update(['status' => 'suspended']);

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('School suspended');
        }

        // Dispatch Email Notification to School Admin
        $recipient = $this->getSchoolAdminEmail($school);
        if ($recipient) {
            try {
                Mail::to($recipient)->send(new SchoolSuspendedMail($school, $request->reason));
            } catch (\Throwable $e) {
                logger()->error("Failed to send suspension email: " . $e->getMessage());
            }
        }

        return back()->with('success', "School \"{$school->name}\" suspended and notification sent.");
    }

    public function activate(Request $request, School $school): RedirectResponse
    {
        $this->authorize('activate', $school);
        $school->update(['status' => 'active']);

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('School activated');
        }

        // Dispatch Email Notification to School Admin
        $recipient = $this->getSchoolAdminEmail($school);
        if ($recipient) {
            try {
                Mail::to($recipient)->send(new SchoolActivatedMail($school));
            } catch (\Throwable $e) {
                logger()->error("Failed to send reactivation email: " . $e->getMessage());
            }
        }

        return back()->with('success', "School \"{$school->name}\" activated and notification sent.");
    }

    public function destroy(School $school): RedirectResponse
    {
        $school->delete();

        return redirect()->route('super-admin.schools.index')
            ->with('success', 'School deleted.');
    }

    public function verify(Request $request, School $school): RedirectResponse
    {
        $this->authorize('update', $school);

        $school->update([
            'verification_status' => 'verified',
            'verified_at'         => now(),
            'verified_by'         => auth()->id(),
        ]);

        if (filled($request->notes)) {
            $existing = $school->verification_notes ? $school->verification_notes . "\n" : '';
            $school->update([
                'verification_notes' => $existing . "[AUDITOR VERIFICATION (" . now()->toDateTimeString() . " - " . auth()->user()->name . ")]: " . trim($request->notes),
            ]);
        }

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('Institutional verification approved');
        }

        // Dispatch Verified Email
        $recipient = $this->getSchoolAdminEmail($school);
        if ($recipient) {
            try {
                Mail::to($recipient)->send(new SchoolVerifiedMail($school, $request->notes, auth()->user()->name));
            } catch (\Throwable $e) {
                logger()->error("Failed to send verification email: " . $e->getMessage());
            }
        }

        return back()->with('success', "Institution \"{$school->name}\" verified and notification dispatched.");
    }

    public function reject(Request $request, School $school): RedirectResponse
    {
        $this->authorize('update', $school);

        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $existing = $school->verification_notes ? $school->verification_notes . "\n" : '';
        $school->update([
            'verification_status' => 'rejected',
            'verified_at'         => now(),
            'verified_by'         => auth()->id(),
            'verification_notes'  => $existing . "[REJECTION REASON (" . now()->toDateTimeString() . " - " . auth()->user()->name . ")]: " . trim($request->reason),
        ]);

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('Institutional verification rejected');
        }

        // Dispatch Rejection Email
        $recipient = $this->getSchoolAdminEmail($school);
        if ($recipient) {
            try {
                Mail::to($recipient)->send(new SchoolVerificationRejectedMail($school, $request->reason));
            } catch (\Throwable $e) {
                logger()->error("Failed to send rejection email: " . $e->getMessage());
            }
        }

        return back()->with('success', "Institution \"{$school->name}\" verification rejected and rectification notice sent.");
    }

    public function updateVerificationNotes(Request $request, School $school): RedirectResponse
    {
        $this->authorize('update', $school);

        $request->validate([
            'notes' => ['required', 'string', 'max:2000'],
        ]);

        $existing = $school->verification_notes ? $school->verification_notes . "\n" : '';
        $school->update([
            'verification_notes' => $existing . "[AUDITOR NOTE (" . now()->toDateTimeString() . " - " . auth()->user()->name . ")]: " . trim($request->notes),
        ]);

        return back()->with('success', 'Auditor note appended to school record.');
    }

    private function getSchoolAdminEmail(School $school): ?string
    {
        if ($school->email) {
            return $school->email;
        }

        $admin = User::where('school_id', $school->id)->first();
        return $admin?->email;
    }
}