<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Holiday::class);
        $sid = $this->getSchoolId();

        $query = Holiday::where('school_id', $sid);

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        if ($request->filled('term') && $request->term !== 'all') {
            $query->where('term', $request->term);
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $holidays = $query->orderBy('date', 'asc')->get();

        $all = Holiday::where('school_id', $sid)->get();
        $stats = [
            'total'          => $all->count(),
            'public_holiday' => $all->where('type', 'public_holiday')->count(),
            'mid_term'       => $all->where('type', 'mid_term_break')->count(),
            'term_break'     => $all->where('type', 'term_break')->count(),
        ];

        return Inertia::render('SchoolAdmin/Holidays/Index', [
            'holidays' => $holidays,
            'stats'    => $stats,
            'filters'  => [
                'type'   => $request->input('type', 'all'),
                'term'   => $request->input('term', 'all'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Holiday::class);
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:150',
                Rule::unique('holidays')->where(fn ($q) => $q->where('school_id', $sid)->where('date', $request->date)),
            ],
            'date'        => 'required|date',
            'end_date'    => 'nullable|date|after_or_equal:date',
            'type'        => 'nullable|string|in:public_holiday,mid_term_break,term_break,school_event',
            'term'        => 'nullable|string|in:Term 1,Term 2,Term 3,Annual',
            'description' => 'nullable|string|max:400',
        ]);

        $data['school_id'] = $sid;
        $data['type']      = $data['type'] ?? 'public_holiday';
        $data['term']      = $data['term'] ?? 'Annual';
        $data['end_date']  = $data['end_date'] ?? $data['date'];

        Holiday::create($data);

        return back()->with('success', 'Holiday entry added to academic calendar.');
    }

    public function update(Request $request, Holiday $holiday): RedirectResponse
    {
        $this->authorize('update', $holiday);
        $sid = $this->getSchoolId();
        abort_if((int) $holiday->school_id !== $sid, 404);

        $data = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:150',
                Rule::unique('holidays')->ignore($holiday->id)->where(fn ($q) => $q->where('school_id', $sid)->where('date', $request->date)),
            ],
            'date'        => 'required|date',
            'end_date'    => 'nullable|date|after_or_equal:date',
            'type'        => 'nullable|string|in:public_holiday,mid_term_break,term_break,school_event',
            'term'        => 'nullable|string|in:Term 1,Term 2,Term 3,Annual',
            'description' => 'nullable|string|max:400',
        ]);

        $data['end_date'] = $data['end_date'] ?? $data['date'];
        $holiday->update($data);

        return back()->with('success', 'Holiday entry updated.');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $this->authorize('delete', $holiday);
        abort_if((int) $holiday->school_id !== $this->getSchoolId(), 404);
        $holiday->delete();

        return back()->with('success', 'Holiday removed from calendar.');
    }
}