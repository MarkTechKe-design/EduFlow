<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Mail\SchoolOnboardingCompletedMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        if (!$user || !$user->school_id) {
            return redirect()->route('dashboard');
        }

        $school = School::where('id', $user->school_id)->first();
        if (!$school) {
            return redirect()->route('dashboard');
        }

        if ($school->onboarding_completed_at !== null) {
            return redirect()->route('dashboard');
        }

        $branding = PlatformSetting::get('branding') ?? [];

        return Inertia::render('Onboarding/Index', [
            'school'   => $school,
            'settings' => SchoolSetting::allFor($school->id),
            'branding' => [
                'name'          => $branding['name'] ?? config('app.name', 'EduFlow'),
                'support_phone' => $branding['support_phone'] ?? '+254 718 178521',
                'support_email' => $branding['support_email'] ?? 'support@eduflow.co.ke',
            ],
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
        $user = $request->user();
        abort_unless($user && $user->school_id, 403, 'Unauthorized tenant context.');

        $school = School::where('id', $user->school_id)->firstOrFail();

        // Normalize payload
        $input = $request->all();
        if (isset($input['curriculum'])) {
            $input['curriculum'] = strtolower(trim($input['curriculum']));
            if ($input['curriculum'] === '8-4-4') $input['curriculum'] = '844';
        }
        if (isset($input['country'])) {
            $country = strtoupper(trim($input['country']));
            if ($country === 'KENYA') $country = 'KE';
            $input['country'] = substr($country, 0, 2);
        } else {
            $input['country'] = 'KE';
        }
        if (empty($input['currency'])) {
            $input['currency'] = 'KES';
        }

        $request->merge($input);

        $data = $request->validate([
            'name'          => ['required', 'string', 'max:150'],
            'phone'         => ['nullable', 'string', 'max:30'],
            'address'       => ['nullable', 'string', 'max:500'],
            'city'          => ['nullable', 'string', 'max:100'],
            'country'       => ['required', 'string', 'size:2'],
            'timezone'      => ['required', 'string', 'max:60'],
            'currency'      => ['required', 'string', 'size:3'],
            'language'      => ['required', 'in:en,sw,fr,ar'],
            'curriculum'    => ['required', 'in:cbc,844,dual,international'],
            'academic_year' => ['required', 'string', 'max:30'],
            'logo'          => ['nullable', 'image', 'max:2048'],
        ]);

        DB::transaction(function () use ($school, $data, $request): void {
            if ($request->hasFile('logo')) {
                if ($school->logo) {
                    Storage::disk('public')->delete($school->logo);
                }
                $data['logo'] = $request->file('logo')->store("schools/{$school->id}", 'public');
            }

            $academicYearName = $data['academic_year'];
            unset($data['academic_year']);

            $school->update(array_merge($data, [
                'onboarding_completed_at' => now(),
            ]));

            AcademicYear::updateOrCreate(
                [
                    'school_id'  => $school->id,
                    'is_current' => true,
                ],
                [
                    'name'       => $academicYearName,
                    'start_date' => now()->startOfYear(),
                    'end_date'   => now()->endOfYear(),
                ]
            );
        });

        return redirect()->route('dashboard')->with('success', 'Workspace setup complete. Welcome to EduFlow.');
    }
}