<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransportController extends Controller
{
    // ── Vehicles ──────────────────────────────────────────────────

    public function vehicles(Request $request)
    {
        $this->authorize('viewAny', Vehicle::class);

        $sid = $this->getSchoolId();

        $vehicles = Vehicle::withCount('routes')
            ->where('school_id', $sid)
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        $stats = [
            'total'       => Vehicle::where('school_id', $sid)->count(),
            'active'      => Vehicle::where('school_id', $sid)->where('status', 'active')->count(),
            'maintenance' => Vehicle::where('school_id', $sid)->where('status', 'maintenance')->count(),
        ];

        return Inertia::render('SchoolAdmin/Transport/Vehicles', [
            'vehicles' => $vehicles,
            'filters'  => $request->only('status'),
            'stats'    => $stats,
        ]);
    }

    public function storeVehicle(Request $request)
    {
        $this->authorize('create', Vehicle::class);

        $data = $request->validate([
            'registration_no' => 'required|string|max:50',
            'name'            => 'nullable|string|max:100',
            'type'            => 'required|in:bus,minibus,van,car,other',
            'capacity'        => 'required|integer|min:1|max:200',
            'driver_name'     => 'nullable|string|max:150',
            'driver_phone'    => 'nullable|string|max:20',
            'helper_name'     => 'nullable|string|max:150',
        ]);

        Vehicle::create(array_merge($data, ['school_id' => $this->getSchoolId()]));

        return back()->with('success', 'Vehicle added.');
    }

    public function updateVehicle(Request $request, Vehicle $vehicle)
    {
        $this->authorize('update', $vehicle);

        $data = $request->validate([
            'registration_no' => 'required|string|max:50',
            'name'            => 'nullable|string|max:100',
            'type'            => 'required|in:bus,minibus,van,car,other',
            'capacity'        => 'required|integer|min:1|max:200',
            'driver_name'     => 'nullable|string|max:150',
            'driver_phone'    => 'nullable|string|max:20',
            'helper_name'     => 'nullable|string|max:150',
            'status'          => 'required|in:active,inactive,maintenance',
        ]);

        $vehicle->update($data);
        return back()->with('success', 'Vehicle updated.');
    }

    public function destroyVehicle(Vehicle $vehicle)
    {
        $this->authorize('delete', $vehicle);

        $vehicle->delete();
        return back()->with('success', 'Vehicle removed.');
    }

    // ── Routes ────────────────────────────────────────────────────

    public function routes(Request $request)
    {
        $this->authorize('viewAny', TransportRoute::class);

        $sid = $this->getSchoolId();

        $routes = TransportRoute::with('vehicle:id,name,registration_no')
            ->withCount('students')
            ->where('school_id', $sid)
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Transport/Routes', [
            'routes'   => $routes,
            'vehicles' => Vehicle::where('school_id', $sid)->where('status', 'active')
                ->orderBy('name')->get(['id', 'name', 'registration_no', 'capacity']),
            'filters'  => $request->only('vehicle_id'),
        ]);
    }

    public function storeRoute(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'vehicle_id'  => 'nullable|integer',
            'start_point' => 'nullable|string|max:200',
            'end_point'   => 'nullable|string|max:200',
            'monthly_fee' => 'nullable|numeric|min:0',
            'stops'       => 'nullable|array',
            'stops.*.name'         => 'required|string|max:200',
            'stops.*.pickup_time'  => 'nullable|string|max:10',
        ]);

        $sid = $this->getSchoolId();
        if (! empty($data['vehicle_id'])) {
            $this->assertVehicleOwnership((int) $data['vehicle_id'], $sid);
        }
        $this->authorize('create', TransportRoute::class);
        TransportRoute::create(array_merge($data, ['school_id' => $sid]));

        return back()->with('success', 'Route created.');
    }

    public function updateRoute(Request $request, TransportRoute $route)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'vehicle_id'  => 'nullable|integer',
            'start_point' => 'nullable|string|max:200',
            'end_point'   => 'nullable|string|max:200',
            'monthly_fee' => 'nullable|numeric|min:0',
            'is_active'   => 'boolean',
            'stops'       => 'nullable|array',
            'stops.*.name'         => 'required|string|max:200',
            'stops.*.pickup_time'  => 'nullable|string|max:10',
        ]);

        $sid = $this->getSchoolId();
        if (! empty($data['vehicle_id'])) {
            $this->assertVehicleOwnership((int) $data['vehicle_id'], $sid);
        }
        $this->authorize('update', $route);

        $route->update($data);
        return back()->with('success', 'Route updated.');
    }

    public function destroyRoute(TransportRoute $route)
    {
        $this->authorize('delete', $route);

        $route->delete();
        return back()->with('success', 'Route deleted.');
    }

    // ── Student Assignments ───────────────────────────────────────

    public function assignments(Request $request, TransportRoute $route)
    {
        $this->authorize('view', $route);

        $sid = $this->getSchoolId();

        $route->load(['vehicle:id,name,registration_no,capacity', 'students.schoolClass:id,name']);

        $assignedIds = $route->students->pluck('id')->toArray();

        $available = Student::where('school_id', $sid)
            ->where('status', 'active')
            ->whereNotIn('id', $assignedIds)
            ->when($request->search, fn ($q) => $q->where(fn ($q2) =>
                $q2->where('first_name', 'like', "%{$request->search}%")
                   ->orWhere('last_name',  'like', "%{$request->search}%")
                   ->orWhere('admission_no', 'like', "%{$request->search}%")
            ))
            ->with('schoolClass:id,name')
            ->orderBy('first_name')
            ->limit(50)
            ->get(['id', 'first_name', 'last_name', 'admission_no', 'class_id']);

        return Inertia::render('SchoolAdmin/Transport/Assignments', [
            'route'     => $route,
            'available' => $available,
            'filters'   => $request->only('search'),
        ]);
    }

    public function assignStudent(Request $request, TransportRoute $route)
    {
        $data = $request->validate([
            'student_id' => 'required|integer',
            'stop'       => 'nullable|string|max:200',
            'fee_linked' => 'boolean',
        ]);

        $sid = $this->getSchoolId();
        $this->assertStudentOwnership((int) $data['student_id'], $sid);
        $this->authorize('assign', $route);

        $route->students()->syncWithoutDetaching([
            $data['student_id'] => [
                'stop'       => $data['stop'] ?? null,
                'fee_linked' => $data['fee_linked'] ?? false,
            ],
        ]);

        return back()->with('success', 'Student assigned to route.');
    }

    public function removeStudent(TransportRoute $route, Student $student)
    {
        $this->assertStudentOwnership($student->id, $this->getSchoolId());
        $this->authorize('unassign', $route);

        $route->students()->detach($student->id);
        return back()->with('success', 'Student removed from route.');
    }

    // ── GPS Tracking Webhook (stub) ───────────────────────────────

    public function trackingWebhook(Request $request, Vehicle $vehicle)
    {
        $this->authorize('track', $vehicle);

        $data = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $vehicle->update([
            'last_lat'         => $data['lat'],
            'last_lng'         => $data['lng'],
            'last_location_at' => now(),
        ]);

        return response()->json(['status' => 'ok']);
    }
    private function assertVehicleOwnership(int $vehicleId, int $schoolId): void
    {
        abort_unless(
            Vehicle::query()->whereKey($vehicleId)->where('school_id', $schoolId)->exists(),
            404
        );
    }

    private function assertStudentOwnership(int $studentId, int $schoolId): void
    {
        abort_unless(
            Student::query()->whereKey($studentId)->where('school_id', $schoolId)->exists(),
            404
        );
    }
}
