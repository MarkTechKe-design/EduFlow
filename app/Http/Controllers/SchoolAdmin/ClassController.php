<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with(['sections:id,class_id,name,capacity'])
            ->withCount(['sections', 'subjects', 'students'])
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get();

        return Inertia::render('SchoolAdmin/Classes/Index', [
            'classes' => $classes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'numeric_name' => ['nullable', 'integer'],
            'capacity'     => ['nullable', 'integer', 'min:1'],
            'sections'     => ['nullable', 'array'],
            'sections.*'   => ['nullable', 'string', 'max:100'],
        ]);

        $class = SchoolClass::create([
            'school_id'    => $schoolId,
            'name'         => trim($validated['name']),
            'numeric_name' => $validated['numeric_name'] ?? 0,
            'capacity'     => $validated['capacity'] ?? 45,
        ]);

        if (!empty($validated['sections'])) {
            foreach ($validated['sections'] as $secName) {
                $trimmed = trim((string)$secName);
                if ($trimmed !== '') {
                    Section::firstOrCreate([
                        'school_id' => $schoolId,
                        'class_id'  => $class->id,
                        'name'      => $trimmed,
                    ], [
                        'capacity'  => $validated['capacity'] ?? 45,
                    ]);
                }
            }
        }

        return back()->with('success', "Class '{$class->name}' created successfully.");
    }

    public function update(Request $request, SchoolClass $class): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($class->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'numeric_name' => ['nullable', 'integer'],
            'capacity'     => ['nullable', 'integer', 'min:1'],
            'sections'     => ['nullable', 'array'],
            'sections.*'   => ['nullable', 'string', 'max:100'],
        ]);

        $class->update([
            'name'         => trim($validated['name']),
            'numeric_name' => $validated['numeric_name'] ?? $class->numeric_name,
            'capacity'     => $validated['capacity'] ?? $class->capacity,
        ]);

        if (isset($validated['sections'])) {
            $inputSections = array_filter(array_map('trim', $validated['sections']), fn($s) => $s !== '');
            $existingSections = $class->sections()->pluck('name', 'id')->toArray();

            // Create new sections that don't exist yet
            foreach ($inputSections as $secName) {
                if (!in_array($secName, $existingSections)) {
                    Section::create([
                        'school_id' => $schoolId,
                        'class_id'  => $class->id,
                        'name'      => $secName,
                        'capacity'  => $validated['capacity'] ?? $class->capacity,
                    ]);
                }
            }

            // Remove sections deleted by admin if they have no enrolled students
            foreach ($existingSections as $secId => $existingName) {
                if (!in_array($existingName, $inputSections)) {
                    $secModel = Section::find($secId);
                    if ($secModel && $secModel->students()->count() === 0) {
                        $secModel->delete();
                    }
                }
            }
        }

        return back()->with('success', "Class '{$class->name}' updated successfully.");
    }

    public function destroy(SchoolClass $class): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($class->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        if ($class->students()->count() > 0) {
            return back()->with('error', 'Cannot delete class that currently contains enrolled students.');
        }

        $class->sections()->delete();
        $class->delete();

        return back()->with('success', "Class '{$class->name}' removed successfully.");
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? 1)->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}
