<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\HostelExeat;
use App\Models\HostelDamage;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class HostelController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Hostel::class);
        $sid = $this->getSchoolId();

        $hostels = Hostel::with('warden:id,first_name,last_name')
            ->withCount(['rooms', 'allocations' => fn ($q) => $q->where('status', 'active')])
            ->where('school_id', $sid)
            ->orderBy('name')
            ->get();

        $allocations = HostelAllocation::with([
            'student:id,first_name,last_name,admission_no,class_id',
            'student.schoolClass:id,name',
            'hostel:id,name,type',
            'room:id,room_no,floor,type',
        ])
            ->where('school_id', $sid)
            ->when($request->hostel_id && $request->hostel_id !== 'all', fn ($q) => $q->where('hostel_id', $request->hostel_id))
            ->when($request->status && $request->status !== 'all',       fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15, ['*'], 'allocations_page')
            ->withQueryString();

        $exeats = HostelExeat::with([
            'student:id,first_name,last_name,admission_no',
            'hostel:id,name',
        ])
            ->where('school_id', $sid)
            ->latest()
            ->paginate(15, ['*'], 'exeats_page')
            ->withQueryString();

        $damages = HostelDamage::with([
            'student:id,first_name,last_name,admission_no',
            'hostel:id,name',
        ])
            ->where('school_id', $sid)
            ->latest()
            ->paginate(15, ['*'], 'damages_page')
            ->withQueryString();

        $rooms = HostelRoom::where('school_id', $sid)
            ->where('status', '!=', 'maintenance')
            ->orderBy('room_no')
            ->get(['id', 'hostel_id', 'room_no', 'floor', 'type', 'capacity', 'occupied', 'monthly_fee', 'status']);

        $stats = [
            'total_hostels'  => $hostels->count(),
            'total_capacity' => $hostels->sum('total_capacity'),
            'occupied'       => HostelAllocation::where('school_id', $sid)->where('status', 'active')->count(),
            'active_exeats'  => HostelExeat::where('school_id', $sid)->whereIn('status', ['pending', 'approved', 'departed'])->count(),
            'unpaid_damages' => HostelDamage::where('school_id', $sid)->where('status', 'reported')->count(),
        ];

        return Inertia::render('SchoolAdmin/Hostel/Index', [
            'hostels'     => $hostels,
            'allocations' => $allocations,
            'exeats'      => $exeats,
            'damages'     => $damages,
            'rooms'       => $rooms,
            'students'    => Student::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'admission_no']),
            'staffList'   => Staff::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'stats'       => $stats,
            'filters'     => $request->only('hostel_id', 'status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:150',
            'type'             => 'required|in:boys,girls,mixed',
            'warden_id'        => 'nullable|integer',
            'housemaster_name' => 'nullable|string|max:150',
            'matron_name'      => 'nullable|string|max:150',
            'phone'            => 'nullable|string|max:25',
            'address'          => 'nullable|string',
            'status'           => 'required|in:active,inactive',
        ]);

        $this->authorize('create', [Hostel::class, $data]);
        Hostel::create(array_merge($data, ['school_id' => $this->getSchoolId()]));

        return back()->with('success', 'Hostel house registered successfully.');
    }

    public function update(Request $request, Hostel $hostel): RedirectResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:150',
            'type'             => 'required|in:boys,girls,mixed',
            'warden_id'        => 'nullable|integer',
            'housemaster_name' => 'nullable|string|max:150',
            'matron_name'      => 'nullable|string|max:150',
            'phone'            => 'nullable|string|max:25',
            'address'          => 'nullable|string',
            'status'           => 'required|in:active,inactive',
        ]);

        $this->authorize('update', [$hostel, $data]);
        $hostel->update($data);

        return back()->with('success', 'Hostel details updated.');
    }

    public function destroy(Hostel $hostel): RedirectResponse
    {
        $this->authorize('delete', $hostel);
        $hostel->delete();
        return back()->with('success', 'Hostel house archived.');
    }

    // --- Rooms & Cubicles ---
    public function rooms(Request $request, Hostel $hostel): Response
    {
        $this->authorize('view', $hostel);
        $hostel->load('warden:id,first_name,last_name');

        $rooms = HostelRoom::withCount(['allocations' => fn ($q) => $q->where('status', 'active')])
            ->where('hostel_id', $hostel->id)
            ->orderBy('floor')
            ->orderBy('room_no')
            ->get();

        return Inertia::render('SchoolAdmin/Hostel/Rooms', [
            'hostel' => $hostel,
            'rooms'  => $rooms,
        ]);
    }

    public function storeRoom(Request $request, Hostel $hostel): RedirectResponse
    {
        $data = $request->validate([
            'room_no'     => 'required|string|max:20',
            'floor'       => 'nullable|string|max:50',
            'type'        => 'required|in:single,double,dormitory',
            'capacity'    => 'required|integer|min:1|max:50',
            'monthly_fee' => 'nullable|numeric|min:0',
        ]);

        $data['school_id'] = $this->getSchoolId();
        $data['hostel_id'] = $hostel->id;
        $data['ac']        = false;

        HostelRoom::create($data);
        $hostel->increment('total_rooms');
        $hostel->increment('total_capacity', (int)$data['capacity']);

        return back()->with('success', 'Cubicle / room added.');
    }

    public function updateRoom(Request $request, Hostel $hostel, HostelRoom $room): RedirectResponse
    {
        $data = $request->validate([
            'room_no'     => 'required|string|max:20',
            'floor'       => 'nullable|string|max:50',
            'type'        => 'required|in:single,double,dormitory',
            'capacity'    => 'required|integer|min:1|max:50',
            'monthly_fee' => 'nullable|numeric|min:0',
            'status'      => 'required|in:available,full,maintenance',
        ]);

        $oldCapacity = $room->capacity;
        $room->update($data);

        $diff = (int)$data['capacity'] - $oldCapacity;
        if ($diff !== 0) {
            $hostel->increment('total_capacity', $diff);
        }

        return back()->with('success', 'Cubicle / room updated.');
    }

    public function destroyRoom(Hostel $hostel, HostelRoom $room): RedirectResponse
    {
        $hostel->decrement('total_rooms');
        $hostel->decrement('total_capacity', $room->capacity);
        $room->delete();
        return back()->with('success', 'Cubicle / room removed.');
    }

    // --- Allocations ---
    public function storeAllocation(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'hostel_id'    => 'required|integer',
            'room_id'      => 'required|integer',
            'student_id'   => 'required|integer',
            'bed_no'       => 'nullable|string|max:20',
            'joining_date' => 'required|date',
            'notes'        => 'nullable|string',
        ]);

        $schoolId = $this->getSchoolId();

        abort_unless(
            Hostel::withoutGlobalScopes()->whereKey($data['hostel_id'])->where('school_id', $schoolId)->exists(),
            403
        );
        abort_unless(
            HostelRoom::withoutGlobalScopes()
                ->whereKey($data['room_id'])
                ->where('school_id', $schoolId)
                ->where('hostel_id', $data['hostel_id'])
                ->exists(),
            403
        );
        abort_unless(
            Student::withoutGlobalScopes()->whereKey($data['student_id'])->where('school_id', $schoolId)->exists(),
            403
        );

        $room = HostelRoom::withoutGlobalScopes()->whereKey($data['room_id'])->firstOrFail();
        if ($room->occupied >= $room->capacity) {
            return back()->withErrors(['room_id' => 'Selected room is at full capacity.']);
        }

        $existing = HostelAllocation::where('student_id', $data['student_id'])->where('status', 'active')->first();
        if ($existing) {
            return back()->withErrors(['student_id' => 'Student is already allocated to a hostel house.']);
        }

        $data['school_id'] = $this->getSchoolId();
        $data['status']    = 'active';
        $data['fee_linked']= true;

        DB::transaction(function () use ($data, $room) {
            HostelAllocation::create($data);
            $room->increment('occupied');
            if ($room->occupied >= $room->capacity) {
                $room->update(['status' => 'full']);
            }
        });

        return back()->with('success', 'Student allocated to bed successfully.');
    }

    public function vacate(Request $request, HostelAllocation $allocation): RedirectResponse
    {
        $data = $request->validate(['leaving_date' => 'required|date']);

        DB::transaction(function () use ($allocation, $data) {
            $allocation->update([
                'status'       => 'left',
                'leaving_date' => $data['leaving_date'],
            ]);

            $room = $allocation->room;
            if ($room) {
                $room->decrement('occupied');
                if ($room->status === 'full') {
                    $room->update(['status' => 'available']);
                }
            }
        });

        return back()->with('success', 'Student checkout recorded.');
    }

    // --- Exeats ---
    public function storeExeat(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'                => 'required|exists:students,id',
            'hostel_id'                 => 'required|exists:hostels,id',
            'exeat_type'                => 'required|in:weekend_out,half_term,medical_leave,disciplinary_suspension',
            'departure_date'            => 'required|date',
            'expected_return_date'      => 'required|date|after_or_equal:departure_date',
            'reason'                    => 'required|string|max:250',
            'guardian_approval_contact' => 'required|string|max:25',
        ]);

        $data['school_id'] = $this->getSchoolId();
        $data['status'] = 'approved';

        HostelExeat::create($data);

        return back()->with('success', 'Exeat movement pass issued.');
    }

    // --- Damages ---
    public function storeDamage(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'hostel_id'     => 'required|exists:hostels,id',
            'item_damaged'  => 'required|string|max:150',
            'fine_amount'   => 'required|numeric|min:0',
            'incident_date' => 'required|date',
            'description'   => 'nullable|string|max:500',
        ]);

        $data['school_id'] = $this->getSchoolId();
        $data['status'] = 'reported';

        HostelDamage::create($data);

        return back()->with('success', 'Property breakage and liability fine recorded.');
    }

    public function hostelRooms(Hostel $hostel)
    {
        $this->authorize('view', $hostel);

        $rooms = HostelRoom::where('hostel_id', $hostel->id)
            ->where('status', 'available')
            ->get(['id', 'room_no', 'floor', 'type', 'capacity', 'occupied', 'monthly_fee']);

        return response()->json($rooms);
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
