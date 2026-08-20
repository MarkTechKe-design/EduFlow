<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(): Response
    {
        $this->getSchoolId();
        return Inertia::render('SchoolAdmin/Shifts/Index', [
            'shifts' => Shift::orderBy('start_time')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->getSchoolId();
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i|after:start_time',
        ]);

        Shift::create($data);

        return back()->with('success', 'Shift created.');
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $this->getSchoolId();
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i|after:start_time',
        ]);

        $shift->update($data);

        return back()->with('success', 'Shift updated.');
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        $this->getSchoolId();
        $shift->delete();

        return back()->with('success', 'Shift deleted.');
    }
}
