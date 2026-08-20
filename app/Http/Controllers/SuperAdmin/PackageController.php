<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\PackageModule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function index(): Response
    {
        $packages = Package::query()
            ->with('modules')
            ->orderBy('sort_order', 'asc')
            ->orderBy('price_monthly', 'asc')
            ->get();

        $availableModules = [
            ['slug' => 'academics', 'name' => 'CBC Academics & Grading'],
            ['slug' => 'attendance', 'name' => 'Student & Staff Attendance'],
            ['slug' => 'finance', 'name' => 'Finance & M-Pesa Integration'],
            ['slug' => 'communication', 'name' => 'SMS & Communication Gateway'],
            ['slug' => 'library', 'name' => 'Library Management'],
            ['slug' => 'hostel', 'name' => 'Hostel & Boarding Operations'],
            ['slug' => 'transport', 'name' => 'Fleet & Transport Routes'],
            ['slug' => 'virtual_class', 'name' => 'Virtual Classrooms (Jitsi)'],
            ['slug' => 'multi_campus', 'name' => 'Multi-Campus Synchronization'],
        ];

        return Inertia::render('SuperAdmin/Packages/Index', [
            'packages'         => $packages,
            'availableModules' => $availableModules,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePackage($request);
        $modules = $validated['modules'] ?? [];
        unset($validated['modules']);

        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['name']);
        
        if (is_string($validated['features'])) {
            $validated['features'] = array_values(array_filter(array_map('trim', explode("\n", $validated['features']))));
        }

        $package = Package::create($validated);

        foreach ($modules as $moduleSlug) {
            PackageModule::create([
                'package_id'  => $package->id,
                'module_slug' => $moduleSlug,
            ]);
        }

        return back()->with('success', 'SaaS Package created successfully.');
    }

    public function update(Request $request, Package $package): RedirectResponse
    {
        $validated = $this->validatePackage($request, $package->id);
        $modules = $validated['modules'] ?? [];
        unset($validated['modules']);

        $validated['slug'] = $validated['slug'] ?: Str::slug($validated['name']);

        if (is_string($validated['features'])) {
            $validated['features'] = array_values(array_filter(array_map('trim', explode("\n", $validated['features']))));
        }

        $package->update($validated);

        PackageModule::where('package_id', $package->id)->delete();
        foreach ($modules as $moduleSlug) {
            PackageModule::create([
                'package_id'  => $package->id,
                'module_slug' => $moduleSlug,
            ]);
        }

        return back()->with('success', 'SaaS Package updated successfully.');
    }

    public function destroy(Package $package): RedirectResponse
    {
        $package->delete();
        return back()->with('success', 'SaaS Package archived.');
    }

    private function validatePackage(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name'          => 'required|string|max:100',
            'badge'         => 'nullable|string|max:60',
            'slug'          => 'nullable|string|max:100|unique:packages,slug' . ($ignoreId ? ',' . $ignoreId : ''),
            'description'   => 'nullable|string|max:500',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly'  => 'required|numeric|min:0',
            'trial_days'    => 'required|integer|min:0|max:365',
            'max_students'  => 'required|integer|min:0',
            'max_staff'     => 'required|integer|min:0',
            'storage_gb'    => 'required|integer|min:1',
            'sort_order'    => 'nullable|integer|min:0',
            'is_active'     => 'boolean',
            'is_popular'    => 'boolean',
            'is_public'     => 'boolean',
            'features'      => 'nullable',
            'modules'       => 'nullable|array',
        ]);
    }
}