<?php

namespace Tests\Feature\Security;

use Tests\Support\CreatesLibraryInventorySecurityFixtures;
use Tests\Support\SecurityTestCase;

class LibraryInventoryAuthorizationTest extends SecurityTestCase
{
    use CreatesLibraryInventorySecurityFixtures;

    public function test_guests_cannot_access_library_inventory_or_asset_workflows(): void
    {
        foreach ([
            ['get', '/school/library/books'], ['get', '/school/library/issues'],
            ['get', '/school/inventory/categories'], ['get', '/school/inventory/items'],
            ['get', '/school/inventory/purchases'], ['get', '/school/inventory/issues'],
            ['get', '/school/inventory/assets'],
        ] as [$method, $uri]) {
            $this->{$method}($uri)->assertRedirect(route('login'));
        }
    }

    public function test_librarian_can_use_same_tenant_library_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createLibraryInventorySecurityUser('librarian', $school, ['library.view', 'library.manage', 'library.issue', 'library.report']);
        $book = $this->createLibraryBook($school);
        $student = $this->createLibraryStudent($school);
        $issue = $this->createBookIssue($school, $book, $student);

        $this->actingAs($user)->get('/school/library/books')->assertOk();
        $this->actingAs($user)->get('/school/library/issues')->assertOk();
        $this->actingAs($user)->get('/school/library/overdue')->assertOk();
        $this->actingAs($user)->post('/school/library/issues', [
            'book_id' => $book->id, 'member_type' => 'student', 'member_id' => $student->id,
            'issued_date' => now()->toDateString(), 'due_date' => now()->addDays(7)->toDateString(),
        ])->assertRedirect();
        $this->actingAs($user)->put('/school/library/issues/' . $issue->id . '/return', [
            'returned_date' => now()->toDateString(),
        ])->assertRedirect();
    }

    public function test_store_manager_can_use_same_tenant_inventory_and_asset_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createLibraryInventorySecurityUser('store-manager', $school, ['inventory.view', 'inventory.manage', 'inventory.issue']);
        $category = $this->createInventoryCategory($school);
        $item = $this->createInventoryItem($school, $category);
        $staff = $this->createLibraryStaff($school);
        $issue = $this->createInventoryIssue($school, $item, $staff);
        $asset = $this->createAsset($school);

        foreach (['/school/inventory/categories', '/school/inventory/items', '/school/inventory/purchases', '/school/inventory/issues', '/school/inventory/assets', '/school/inventory/assets/' . $asset->id] as $uri) {
            $this->actingAs($user)->get($uri)->assertOk();
        }
        $this->actingAs($user)->post('/school/inventory/purchases', [
            'item_id' => $item->id, 'purchase_date' => now()->toDateString(), 'quantity' => 1, 'unit_price' => 5,
        ])->assertRedirect();
        $this->actingAs($user)->put('/school/inventory/issues/' . $issue->id . '/return', [
            'return_date' => now()->toDateString(), 'returned_quantity' => 1,
        ])->assertRedirect();
        $this->actingAs($user)->post('/school/inventory/assets/' . $asset->id . '/maintenance', [
            'date' => now()->toDateString(), 'description' => 'Routine inspection',
        ])->assertRedirect();
    }

    public function test_roles_without_library_or_inventory_permissions_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        foreach ([
            ['teacher', '/school/library/books'], ['accountant', '/school/library/books'],
            ['librarian', '/school/inventory/items'], ['teacher', '/school/inventory/assets'],
            ['student', '/school/library/books'], ['parent', '/school/inventory/items'],
        ] as [$role, $uri]) {
            $user = $this->createLibraryInventorySecurityUser($role, $school);
            $this->actingAs($user)->get($uri)->assertForbidden();
        }
    }

    public function test_cross_tenant_library_and_inventory_records_and_related_ids_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createLibraryInventorySecurityUser('school-admin', $schoolA, ['library.view', 'library.manage', 'library.issue', 'inventory.view', 'inventory.manage', 'inventory.issue']);
        $bookB = $this->createLibraryBook($schoolB);
        $studentB = $this->createLibraryStudent($schoolB);
        $categoryB = $this->createInventoryCategory($schoolB);
        $itemB = $this->createInventoryItem($schoolB, $categoryB);
        $staffB = $this->createLibraryStaff($schoolB);
        $assetB = $this->createAsset($schoolB);

        $this->actingAs($user)->put('/school/library/books/' . $bookB->id, ['title' => 'Cross Tenant', 'author' => 'Denied', 'total_copies' => 1])->assertNotFound();
        $this->actingAs($user)->post('/school/library/issues', ['book_id' => $bookB->id, 'member_type' => 'student', 'member_id' => $studentB->id, 'issued_date' => now()->toDateString(), 'due_date' => now()->addDay()->toDateString()])->assertNotFound();
        $this->actingAs($user)->post('/school/inventory/items', ['category_id' => $categoryB->id, 'name' => 'Cross Tenant', 'unit' => 'pcs', 'minimum_stock' => 1])->assertNotFound();
        $this->actingAs($user)->post('/school/inventory/purchases', ['item_id' => $itemB->id, 'purchase_date' => now()->toDateString(), 'quantity' => 1, 'unit_price' => 1])->assertNotFound();
        $this->actingAs($user)->post('/school/inventory/issues', ['item_id' => $itemB->id, 'issued_to_type' => 'staff', 'issued_to_id' => $staffB->id, 'issued_to_name' => 'Cross Tenant', 'quantity' => 1, 'issue_date' => now()->toDateString()])->assertNotFound();
        $this->actingAs($user)->get('/school/inventory/assets/' . $assetB->id)->assertNotFound();
    }

    public function test_school_status_and_super_admin_context_fail_closed(): void
    {
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $user = $this->createLibraryInventorySecurityUser('librarian', $suspended, ['library.view']);
        $this->actingAs($user)->get('/school/library/books')->assertForbidden();

        $deleted = $this->createSecuritySchool();
        $user = $this->createLibraryInventorySecurityUser('store-manager', $deleted, ['inventory.view']);
        $deleted->delete();
        $this->actingAs($user)->get('/school/inventory/items')->assertForbidden();

        $user = $this->createLibraryInventorySecurityUser('super-admin', null, ['library.view', 'inventory.view']);
        $this->actingAs($user)->get('/school/library/books')->assertForbidden();
        $this->actingAs($user)->get('/school/inventory/items')->assertForbidden();
    }

    public function test_client_school_id_cannot_move_new_library_or_inventory_records(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createLibraryInventorySecurityUser('school-admin', $schoolA, ['library.manage', 'inventory.manage', 'inventory.view', 'library.view']);
        $category = $this->createInventoryCategory($schoolA);

        $this->actingAs($user)->post('/school/library/books', ['school_id' => $schoolB->id, 'title' => 'Owned Book', 'author' => 'Author', 'total_copies' => 1])->assertRedirect();
        $this->assertDatabaseHas('books', ['title' => 'Owned Book', 'school_id' => $schoolA->id]);
        $this->actingAs($user)->post('/school/inventory/items', ['school_id' => $schoolB->id, 'category_id' => $category->id, 'name' => 'Owned Item', 'unit' => 'pcs', 'minimum_stock' => 1])->assertRedirect();
        $this->assertDatabaseHas('inventory_items', ['name' => 'Owned Item', 'school_id' => $schoolA->id]);
    }
}