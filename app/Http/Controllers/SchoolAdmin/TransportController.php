<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\TransportRoute;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransportController extends Controller
{
    public function index(Request $request): Response
    {
        return $this->vehicles($request);
    }

    public function vehicles(Request $request): Response
    {
        $this->authorize('viewAny', Vehicle::class);

        $sid = $this->getSchoolId();

        $vehicles = Vehicle::withCount('routes')
            ->where('school_id', $sid)
            ->when($request->vehicle_search, function ($q, $s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('registration_no', 'like', "%{$s}%")
                    ->orWhere('driver_name', 'like', "%{$s}%");
            })
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
            'filters'  => $request->only('status', 'vehicle_search'),
            'stats'    => $stats,
        ]);
    }

    public function storeVehicle(Request $request): RedirectResponse
    {
        $this->authorize('create', Vehicle::class);

        $sid = $this->getSchoolId();
        $data = $request->validate([
            'registration_no' => 'required|string|max:50',
            'name'            => 'nullable|string|max:100',
            'type'            => 'required|in:bus,minibus,van,car,other',
            'capacity'        => 'required|integer|min:1|max:200',
            'driver_name'     => 'nullable|string|max:150',
            'driver_phone'    => 'nullable|string|max:20',
            'helper_name'     => 'nullable|string|max:150',
            'status'          => 'nullable|in:active,inactive,maintenance',
        ]);

        $data['school_id'] = $sid;
        $data['status'] = $data['status'] ?? 'active';

        Vehicle::create($data);

        return back()->with('success', 'Vehicle added.');
    }

    public function updateVehicle(Request $request, Vehicle $vehicle): RedirectResponse
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

    public function destroyVehicle(Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('delete', $vehicle);

        $vehicle->delete();
        return back()->with('success', 'Vehicle removed.');
    }

    public function routes(Request $request): Response
    {
        $this->authorize('viewAny', TransportRoute::class);

        $sid = $this->getSchoolId();

        $routes = TransportRoute::with('vehicle:id,name,registration_no')
            ->withCount('students')
            ->where('school_id', $sid)
            ->when($request->route_search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Transport/Routes', [
            'routes'   => $routes,
            'vehicles' => Vehicle::where('school_id', $sid)->where('status', 'active')->orderBy('name')->get(['id', 'name', 'registration_no', 'capacity']),
            'filters'  => $request->only('vehicle_id', 'route_search'),
        ]);
    }

    public function storeRoute(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'vehicle_id'  => 'nullable|integer',
            'start_point' => 'nullable|string|max:200',
            'end_point'   => 'nullable|string|max:200',
            'monthly_fee' => 'nullable|numeric|min:0',
            'stops'       => 'nullable',
        ]);

        $sid = $this->getSchoolId();
        if (! empty($data['vehicle_id'])) {
            $this->assertVehicleOwnership((int) $data['vehicle_id'], $sid);
        }
        $this->authorize('create', TransportRoute::class);
        TransportRoute::create(array_merge($data, ['school_id' => $sid]));

        return back()->with('success', 'Route created.');
    }

    public function updateRoute(Request $request, TransportRoute $route): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'vehicle_id'  => 'nullable|integer',
            'start_point' => 'nullable|string|max:200',
            'end_point'   => 'nullable|string|max:200',
            'monthly_fee' => 'nullable|numeric|min:0',
            'is_active'   => 'nullable|boolean',
            'stops'       => 'nullable',
        ]);

        $sid = $this->getSchoolId();
        if (! empty($data['vehicle_id'])) {
            $this->assertVehicleOwnership((int) $data['vehicle_id'], $sid);
        }
        $this->authorize('update', $route);

        $route->update($data);
        return back()->with('success', 'Route updated.');
    }

    public function destroyRoute(TransportRoute $route): RedirectResponse
    {
        $this->authorize('delete', $route);

        $route->delete();
        return back()->with('success', 'Route deleted.');
    }

    public function assignments(Request $request, TransportRoute $route): Response
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

    public function assignStudent(Request $request, TransportRoute $route): RedirectResponse
    {
        $data = $request->validate([
            'student_id' => 'required|integer',
            'stop'       => 'nullable|string|max:200',
            'fee_linked' => 'nullable|boolean',
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

    public function removeStudent(TransportRoute $route, Student $student): RedirectResponse
    {
        $this->assertStudentOwnership($student->id, $this->getSchoolId());
        $this->authorize('unassign', $route);

        $route->students()->detach($student->id);
        return back()->with('success', 'Student removed from route.');
    }

    public function unassignStudent(TransportRoute $route, Student $student): RedirectResponse
    {
        return $this->removeStudent($route, $student);
    }

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