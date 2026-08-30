<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $query = Designation::where('school_id', $sid)
            ->with('department:id,name')
            ->withCount('staff');

        if ($request->filled('cadre') && $request->cadre !== 'all') {
            $query->where('cadre', $request->cadre);
        }
        if ($request->filled('department_id') && $request->department_id !== 'all') {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $designations = $query->orderBy('is_leadership', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        $all = Designation::where('school_id', $sid)->get();
        $stats = [
            'total'              => $all->count(),
            'leadership'         => $all->where('is_leadership', true)->count(),
            'teaching'           => $all->where('cadre', 'teaching')->count(),
            'operations_support' => $all->whereIn('cadre', ['operations_support', 'finance_admin'])->count(),
        ];

        return Inertia::render('SchoolAdmin/Designations/Index', [
            'designations' => $designations,
            'departments'  => Department::where('school_id', $sid)->orderBy('name')->get(['id', 'name']),
            'stats'        => $stats,
            'filters'      => [
                'cadre'         => $request->input('cadre', 'all'),
                'department_id' => $request->input('department_id', 'all'),
                'search'        => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'department_id' => ['nullable', Rule::exists('departments', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'name'          => [
                'required',
                'string',
                'max:100',
                Rule::unique('designations')->where(fn ($q) => $q->where('school_id', $sid)->where('department_id', $request->department_id)),
            ],
            'cadre'         => 'required|in:leadership,teaching,finance_admin,operations_support',
            'is_leadership' => 'boolean',
            'description'   => 'nullable|string|max:500',
        ]);

        Designation::create(array_merge($data, [
            'school_id'     => $sid,
            'is_leadership' => $data['is_leadership'] ?? false,
        ]));

        return back()->with('success', 'Staff designation created successfully.');
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_if($designation->school_id !== $sid, 403);

        $data = $request->validate([
            'department_id' => ['nullable', Rule::exists('departments', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'name'          => [
                'required',
                'string',
                'max:100',
                Rule::unique('designations')->ignore($designation->id)->where(fn ($q) => $q->where('school_id', $sid)->where('department_id', $request->department_id)),
            ],
            'cadre'         => 'required|in:leadership,teaching,finance_admin,operations_support',
            'is_leadership' => 'boolean',
            'description'   => 'nullable|string|max:500',
        ]);

        $designation->update($data);
        return back()->with('success', 'Staff designation updated.');
    }

    public function destroy(Designation $designation): RedirectResponse
    {
        abort_if($designation->school_id !== $this->getSchoolId(), 403);
        $designation->delete();
        return back()->with('success', 'Designation archived.');
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
