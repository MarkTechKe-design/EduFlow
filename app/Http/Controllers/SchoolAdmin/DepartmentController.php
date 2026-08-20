<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $this->getSchoolId();
        $departments = Department::withCount('staff')
            ->orderBy('name')
            ->get();

        return Inertia::render('SchoolAdmin/Departments/Index', [
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->getSchoolId();
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'code'        => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
        ]);

        Department::create($data);

        return back()->with('success', 'Department created.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $this->getSchoolId();
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'code'        => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
        ]);

        $department->update($data);

        return back()->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $this->getSchoolId();
        $department->delete();

        return back()->with('success', 'Department deleted.');
    }
}
