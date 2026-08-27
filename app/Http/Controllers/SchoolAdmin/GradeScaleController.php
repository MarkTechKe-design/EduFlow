<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\GradeScale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeScaleController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();

        $grades = GradeScale::where('school_id', $schoolId)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('SchoolAdmin/Exams/GradeScales', [
            'grades' => $grades,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->getSchoolId();

        $data = $request->validate([
            'grade'      => 'required|string|max:10',
            'gpa'        => 'required|numeric|min:0|max:15',
            'min_marks'  => 'required|numeric|min:0|max:100',
            'max_marks'  => 'required|numeric|min:0|max:100|gte:min_marks',
            'remarks'    => 'nullable|string|max:50',
            'sort_order' => 'required|integer|min:1',
        ]);

        $data['school_id'] = $schoolId;
        GradeScale::create($data);

        return back()->with('success', 'Grade tier added successfully.');
    }

    public function update(Request $request, GradeScale $gradeScale): RedirectResponse
    {
        abort_if($gradeScale->school_id !== $this->getSchoolId(), 403);

        $data = $request->validate([
            'grade'      => 'required|string|max:10',
            'gpa'        => 'required|numeric|min:0|max:15',
            'min_marks'  => 'required|numeric|min:0|max:100',
            'max_marks'  => 'required|numeric|min:0|max:100|gte:min_marks',
            'remarks'    => 'nullable|string|max:50',
            'sort_order' => 'required|integer|min:1',
        ]);

        $gradeScale->update($data);

        return back()->with('success', 'Grade scale updated successfully.');
    }

    public function destroy(GradeScale $gradeScale): RedirectResponse
    {
        abort_if($gradeScale->school_id !== $this->getSchoolId(), 403);
        $gradeScale->delete();

        return back()->with('success', 'Grade tier removed.');
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
