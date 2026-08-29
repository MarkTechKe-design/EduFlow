<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\SchoolRequest;
use App\Models\School;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(School::class, 'school');
    }

    public function index(Request $request): Response
    {
        $schools = School::withTrashed(false)
            ->withCount('users')->with(['latestSubscription.package'])
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->verification_status, fn ($q) => $q->where('verification_status', $request->verification_status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Schools/Index', [
            'schools' => [
                'data' => $schools->items(),
                'meta' => [
                    'total' => $schools->total(),
                    'per_page' => $schools->perPage(),
                    'current_page' => $schools->currentPage(),
                    'last_page' => $schools->lastPage(),
                    'from' => $schools->firstItem(),
                    'to' => $schools->lastItem(),
                ],
                'links' => [
                    'first' => $schools->url(1),
                    'last' => $schools->url($schools->lastPage()),
                    'prev' => $schools->previousPageUrl(),
                    'next' => $schools->nextPageUrl(),
                ],
            ],
            'filters' => $request->only('search', 'status'),
            'stats' => [
                'total' => School::count(),
                'active' => School::where('status', 'active')->count(),
                'suspended' => School::where('status', 'suspended')->count(),
                'pending_verification' => School::where('verification_status', 'pending')->count(),
                'verified' => School::where('verification_status', 'verified')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SuperAdmin/Schools/Create');
    }

    public function store(SchoolRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $school = School::create($data);

        activity()->causedBy($request->user())->performedOn($school)->log('School created');

        return redirect()->route('super-admin.schools.index')
            ->with('success', "School \"{$school->name}\" created successfully.");
    }

    public function show(School $school): Response
    {
        $school->load(['academicYears' => fn ($q) => $q->latest(), 'verifiedBy:id,name,email']);
        $school->loadCount('users');

        return Inertia::render('SuperAdmin/Schools/Show', ['school' => $school]);
    }

    public function edit(School $school): Response
    {
        return Inertia::render('SuperAdmin/Schools/Edit', ['school' => $school]);
    }

    public function update(SchoolRequest $request, School $school): RedirectResponse
    {
        $school->update($request->validated());

        activity()->causedBy($request->user())->performedOn($school)->log('School updated');

        return redirect()->route('super-admin.schools.index')
            ->with('success', "School \"{$school->name}\" updated.");
    }

    public function suspend(Request $request, School $school): RedirectResponse
    {
        $this->authorize('suspend', $school);
        $school->update(['status' => 'suspended']);

        activity()->causedBy($request->user())->performedOn($school)->log('School suspended');

        return back()->with('success', "School \"{$school->name}\" suspended.");
    }

    public function activate(Request $request, School $school): RedirectResponse
    {
        $this->authorize('activate', $school);
        $school->update(['status' => 'active']);

        activity()->causedBy($request->user())->performedOn($school)->log('School activated');

        return back()->with('success', "School \"{$school->name}\" activated.");
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
            'verified_at' => now(),
            'verified_by' => auth()->id(),
        ]);

        if (filled($request->notes)) {
            $existing = $school->verification_notes ? $school->verification_notes . "\n" : '';
            $school->update([
                'verification_notes' => $existing . "[AUDITOR NOTE (" . now()->toDateTimeString() . " - " . auth()->user()->name . ")]: " . trim($request->notes),
            ]);
        }

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('Institutional verification approved');
        }

        return back()->with('success', "Institution \"{$school->name}\" marked as Verified.");
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
            'verified_at' => now(),
            'verified_by' => auth()->id(),
            'verification_notes' => $existing . "[REJECTION REASON (" . now()->toDateTimeString() . " - " . auth()->user()->name . ")]: " . trim($request->reason),
        ]);

        if (function_exists('activity')) {
            activity()->causedBy($request->user())->performedOn($school)->log('Institutional verification rejected');
        }

        return back()->with('success', "Institution \"{$school->name}\" verification rejected.");
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

        return back()->with('success', "Verification notes updated for \"{$school->name}\".");
    }
}