<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    /**
     * Get sections for a specific class (JSON for dynamic dropdowns)
     */
    public function byClass(Request $request, SchoolClass $class): JsonResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($class->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $sections = Section::where('school_id', $schoolId)
            ->where('class_id', $class->id)
            ->orderBy('name')
            ->get(['id', 'name', 'capacity']);

        return response()->json($sections);
    }

    /**
     * Store a new custom stream/section
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $schoolId = auth()->user()->school_id;
        $validated = $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'name'     => ['required', 'string', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $section = Section::firstOrCreate(
            [
                'school_id' => $schoolId,
                'class_id'  => $validated['class_id'],
                'name'      => trim($validated['name']),
            ],
            [
                'capacity' => $validated['capacity'] ?? 45,
            ]
        );

        if ($request->wantsJson()) {
            return response()->json($section, 201);
        }

        return back()->with('success', "Section '{$section->name}' created successfully.");
    }

    /**
     * Rename or update an existing stream
     */
    public function update(Request $request, Section $section): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($section->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $section->update($validated);

        return back()->with('success', "Section updated successfully.");
    }

    /**
     * Delete an empty section safely
     */
    public function destroy(Section $section): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($section->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        if ($section->students()->count() > 0) {
            return back()->with('error', 'Cannot delete section that currently contains enrolled students.');
        }

        $section->delete();

        return back()->with('success', 'Section deleted successfully.');
    }
}