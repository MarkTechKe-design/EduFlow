<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\School;
use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $school = School::find($request->user()->school_id);

        if (!$school) {
            return redirect()->route('dashboard');
        }

        if ($school->onboarding_completed_at !== null) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding/Index', [
            'school'   => $school,
            'settings' => SchoolSetting::allFor($school->id),
            'steps'    => [
                'school'   => 'School details',
                'academic' => 'Academic setup',
                'brand'    => 'Brand your workspace',
                'launch'   => 'Ready to launch',
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $school = School::find($request->user()->school_id);
        abort_unless($school, 404);

        $data = $request->validate([
            'name'          => 'required|string|max:150',
            'phone'         => 'nullable|string|max:30',
            'address'       => 'nullable|string|max:500',
            'city'          => 'nullable|string|max:100',
            'country'       => 'required|string|size:2',
            'timezone'      => 'required|string|max:60',
            'currency'      => 'required|string|size:3',
            'language'      => 'required|in:en,sw,fr,ar',
            'curriculum'    => 'required|in:cbc,844',
            'academic_year' => 'required|string|max:30',
            'logo'          => 'nullable|image|max:2048',
        ]);

        DB::transaction(function () use ($school, $data, $request): void {
            if ($request->hasFile('logo')) {
                if ($school->logo) {
                    Storage::disk('public')->delete($school->logo);
                }
                $data['logo'] = $request->file('logo')->store("schools/{$school->id}", 'public');
            }

            $school->update($data + ['onboarding_completed_at' => now()]);

            AcademicYear::updateOrCreate(
                ['school_id' => $school->id, 'is_current' => true],
                [
                    'name'       => $data['academic_year'],
                    'start_date' => now()->startOfYear(),
                    'end_date'   => now()->endOfYear(),
                ]
            );
        });

        return redirect()->route('dashboard')->with('success', 'Workspace setup complete. Welcome to EduFlow.');
    }
}