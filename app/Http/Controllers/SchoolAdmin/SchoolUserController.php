<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Support\SessionRevoker;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class SchoolUserController extends Controller
{
    private function sid(): int
    {
        return $this->getSchoolId();
    }

    /** School-level roles that can be managed by a school-admin */
    private function allowedRoles(): array
    {
        return [
            'principal', 'teacher', 'accountant',
            'librarian', 'receptionist', 'driver', 'warden', 'store-manager',
        ];
    }

    public function index(Request $request): Response
    {
        $this->authorize('schoolViewAny', User::class);
        $sid = $this->sid();

        $users = User::with('roles')
            ->where('school_id', $sid)
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->role, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $request->role)))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $roles = Role::whereIn('name', $this->allowedRoles())->orderBy('name')->pluck('name');

        return Inertia::render('SchoolAdmin/Settings/Admins', [
            'users' => [
                'data' => $users->items(),
                'meta' => [
                    'total'        => $users->total(),
                    'per_page'     => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page'    => $users->lastPage(),
                ],
            ],
            'roles'   => $roles,
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('schoolCreate', User::class);
        $sid = $this->sid();

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role'     => ['required', 'string', Rule::in($this->allowedRoles())],
            'status'   => 'required|in:active,inactive',
        ]);

        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'phone'     => $data['phone'] ?? null,
            'password'  => Hash::make($data['password']),
            'school_id' => $sid,
            'status'    => $data['status'],
        ]);

        $user->assignRole($data['role']);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('schoolUpdate', $user);

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'    => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'role'     => ['required', 'string', Rule::in($this->allowedRoles())],
            'status'   => 'required|in:active,inactive,suspended',
        ]);

        $user->update([
            'name'   => $data['name'],
            'email'  => $data['email'],
            'phone'  => $data['phone'] ?? null,
            'status' => $data['status'],
        ]);

        if (!blank($data['password'])) {
            $user->update([
                'password' => Hash::make($data['password']),
                'remember_token' => Str::random(60),
            ]);
            SessionRevoker::forUser($user);
        }

        $user->syncRoles([$data['role']]);

        if ($data['status'] !== 'active') {
            SessionRevoker::forUser($user);
        }

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('schoolDelete', $user);

        SessionRevoker::forUser($user);
        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function suspend(User $user): RedirectResponse
    {
        $this->authorize('schoolSuspend', $user);

        $user->update(['status' => 'suspended']);
        SessionRevoker::forUser($user);
        return back()->with('success', 'User suspended.');
    }

    public function activate(User $user): RedirectResponse
    {
        $this->authorize('schoolActivate', $user);

        $user->update(['status' => 'active']);
        return back()->with('success', 'User activated.');
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

