<?php

namespace Tests\Support;

use App\Models\Asset;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\Department;
use App\Models\InventoryCategory;
use App\Models\InventoryIssue;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesLibraryInventorySecurityFixtures
{
    protected function createLibraryInventorySecurityUser(string $role, ?School $school, array $permissions = []): User
    {
        $user = $this->createSecurityUser($school, [
            'email' => $role . '-' . uniqid() . '@example.test',
        ]);
        $roleModel = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $permissionModels = collect($permissions)->map(fn (string $permission) => Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]));
        $roleModel->syncPermissions($permissionModels);
        $user->assignRole($roleModel);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    protected function createLibraryBook(School $school, array $attributes = []): Book
    {
        return Book::withoutGlobalScopes()->create(array_merge([
            'school_id' => $school->id,
            'title' => 'Security Book ' . uniqid(),
            'author' => 'Security Author',
            'total_copies' => 3,
            'available_copies' => 3,
            'is_active' => true,
        ], $attributes));
    }

    protected function createLibraryStudent(School $school): Student
    {
        $class = SchoolClass::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Library Class ' . uniqid(),
            'numeric_name' => 1,
        ]);

        return Student::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'first_name' => 'Library',
            'last_name' => 'Student',
            'gender' => 'other',
            'category' => 'general',
            'status' => 'active',
        ]);
    }

    protected function createLibraryStaff(School $school): Staff
    {
        return Staff::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'first_name' => 'Library',
            'last_name' => 'Staff',
            'gender' => 'other',
            'salary_type' => 'fixed',
            'status' => 'active',
        ]);
    }

    protected function createBookIssue(School $school, Book $book, Student|Staff $member): BookIssue
    {
        return BookIssue::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'book_id' => $book->id,
            'member_type' => $member instanceof Student ? Student::class : Staff::class,
            'member_id' => $member->id,
            'issued_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'issued',
            'fine_per_day' => 2,
        ]);
    }

    protected function createInventoryCategory(School $school): InventoryCategory
    {
        return InventoryCategory::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Security Category ' . uniqid(),
        ]);
    }

    protected function createInventoryItem(School $school, InventoryCategory $category): InventoryItem
    {
        return InventoryItem::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'category_id' => $category->id,
            'name' => 'Security Item ' . uniqid(),
            'unit' => 'pcs',
            'current_stock' => 10,
            'minimum_stock' => 2,
            'is_active' => true,
        ]);
    }

    protected function createInventoryPurchase(School $school, InventoryItem $item): InventoryPurchase
    {
        return InventoryPurchase::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'item_id' => $item->id,
            'purchase_date' => now()->toDateString(),
            'quantity' => 2,
            'unit_price' => 10,
            'total_price' => 20,
        ]);
    }

    protected function createDepartment(School $school): Department
    {
        return Department::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Security Department ' . uniqid(),
        ]);
    }

    protected function createInventoryIssue(School $school, InventoryItem $item, Staff $staff): InventoryIssue
    {
        return InventoryIssue::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'item_id' => $item->id,
            'issued_to_type' => 'staff',
            'issued_to_id' => $staff->id,
            'issued_to_name' => $staff->first_name,
            'quantity' => 1,
            'issue_date' => now()->toDateString(),
            'status' => 'issued',
        ]);
    }

    protected function createAsset(School $school, array $attributes = []): Asset
    {
        return Asset::withoutGlobalScopes()->create(array_merge([
            'school_id' => $school->id,
            'name' => 'Security Asset ' . uniqid(),
            'category' => 'Equipment',
            'purchase_price' => 100,
            'current_value' => 100,
            'depreciation_method' => 'straight_line',
            'depreciation_rate' => 10,
            'status' => 'active',
        ], $attributes));
    }
}