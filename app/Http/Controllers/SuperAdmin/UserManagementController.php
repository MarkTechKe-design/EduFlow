<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Support\Authorization\RoleCatalog;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::with('roles')
            ->when($request->search, fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%")))
            ->when($request->role, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $request->role)))
            ->when($request->school_id, fn ($q) => $q->where('school_id', $request->school_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->withTrashed(false)->latest()->paginate(20)->withQueryString();

        return Inertia::render('SuperAdmin/Users/Index', [
            'users' => [
                'data' => $users->items(),
                'meta' => [
                    'total' => $users->total(), 'per_page' => $users->perPage(),
                    'current_page' => $users->currentPage(), 'last_page' => $users->lastPage(),
                ],
            ],
            'schools' => School::select('id', 'name')->orderBy('name')->get(),
            'roles' => Role::orderBy('name')->pluck('name'),
            'filters' => $request->only(['search', 'role', 'school_id', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);
        $data = $this->validated($request);
        $this->assertRoleSchoolContext($data['role'], $data['school_id'] ?? null);
        $this->assertSchoolOwnership($data['school_id'] ?? null);

        $user = User::create([
            'name' => $data['name'], 'email' => $data['email'], 'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']), 'school_id' => $data['school_id'] ?? null,
            'status' => $data['status'],
        ]);
        $user->assignRole($data['role']);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);
        $data = $this->validated($request, $user);
        $this->assertRoleSchoolContext($data['role'], $data['school_id'] ?? null);
        $this->assertSchoolOwnership($data['school_id'] ?? null);

        $user->update([
            'name' => $data['name'], 'email' => $data['email'], 'phone' => $data['phone'] ?? null,
            'school_id' => $data['school_id'] ?? null, 'status' => $data['status'],
        ]);
        if (! blank($data['password'] ?? null)) $user->update(['password' => Hash::make($data['password'])]);
        $user->syncRoles([$data['role']]);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);
        $user->delete();
        return back()->with('success', 'User deleted.');
    }

    public function suspend(User $user): RedirectResponse
    {
        $this->authorize('suspend', $user);
        $user->update(['status' => 'suspended']);
        return back()->with('success', 'User suspended.');
    }

    public function activate(User $user): RedirectResponse
    {
        $this->authorize('activate', $user);
        $user->update(['status' => 'active']);
        return back()->with('success', 'User activated.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $this->authorize('resetPassword', $user);
        $data = $request->validate(['password' => 'required|string|min:8']);
        $user->update(['password' => Hash::make($data['password'])]);
        return back()->with('success', 'Password reset successfully.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone' => 'nullable|string|max:20',
            'password' => $user ? 'nullable|string|min:8' : 'required|string|min:8',
            'role' => ['required', Rule::in(RoleCatalog::all())],
            'school_id' => 'nullable|integer',
            'status' => 'required|in:active,inactive,suspended',
        ]);
    }

    private function assertRoleSchoolContext(string $role, mixed $schoolId): void
    {
        $hasSchool = $schoolId !== null && $schoolId !== '';

        if ($role === RoleCatalog::PLATFORM_ROLE && $hasSchool) {
            throw ValidationException::withMessages(['school_id' => 'Platform Super Admin users cannot belong to a school.']);
        }

        if ($role !== RoleCatalog::PLATFORM_ROLE && ! $hasSchool) {
            throw ValidationException::withMessages(['school_id' => 'This role requires a school tenant.']);
        }
    }

    private function assertSchoolOwnership(?int $schoolId): void
    {
        if ($schoolId === null) return;

        abort_unless(
            School::query()->whereKey($schoolId)->whereNull('deleted_at')->exists(),
            422,
            'The selected school is invalid.'
        );
    }
}
