<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $query = Department::where('school_id', $sid)
            ->with(['hod:id,first_name,last_name,emp_id'])
            ->withCount(['staff', 'designations']);

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        $departments = $query->orderBy('type')->orderBy('name')->get();

        $all = Department::where('school_id', $sid)->get();
        $stats = [
            'total'          => $all->count(),
            'academic'       => $all->where('type', 'academic')->count(),
            'administration' => $all->where('type', 'administration')->count(),
            'support'        => $all->whereIn('type', ['support', 'finance'])->count(),
        ];

        return Inertia::render('SchoolAdmin/Departments/Index', [
            'departments' => $departments,
            'staff'       => Staff::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'stats'       => $stats,
            'filters'     => [
                'type'   => $request->input('type', 'all'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments')->where(fn ($q) => $q->where('school_id', $sid)),
            ],
            'code'        => 'nullable|string|max:20',
            'type'        => 'required|in:academic,administration,support,finance',
            'hod_id'      => ['nullable', Rule::exists('staff', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'description' => 'nullable|string|max:500',
        ]);

        $data['school_id'] = $sid;
        Department::create($data);

        return back()->with('success', 'Department established successfully.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_if($department->school_id !== $sid, 403);

        $data = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments')->ignore($department->id)->where(fn ($q) => $q->where('school_id', $sid)),
            ],
            'code'        => 'nullable|string|max:20',
            'type'        => 'required|in:academic,administration,support,finance',
            'hod_id'      => ['nullable', Rule::exists('staff', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'description' => 'nullable|string|max:500',
        ]);

        $department->update($data);
        return back()->with('success', 'Department details updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        abort_if($department->school_id !== $this->getSchoolId(), 403);
        $department->delete();
        return back()->with('success', 'Department archived.');
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
