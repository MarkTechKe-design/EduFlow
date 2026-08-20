<?php

namespace Tests\Unit\Security;

use App\Http\Controllers\SchoolAdmin\LibraryController;
use App\Models\Asset;
use App\Models\AssetMaintenanceLog;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\BookReservation;
use App\Models\InventoryCategory;
use App\Models\InventoryIssue;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\User;
use App\Policies\AssetMaintenanceLogPolicy;
use App\Policies\AssetPolicy;
use App\Policies\BookIssuePolicy;
use App\Policies\BookPolicy;
use App\Policies\BookReservationPolicy;
use App\Policies\InventoryCategoryPolicy;
use App\Policies\InventoryIssuePolicy;
use App\Policies\InventoryItemPolicy;
use App\Policies\InventoryPurchasePolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesLibraryInventorySecurityFixtures;
use Tests\Support\SecurityTestCase;

class LibraryInventoryPolicyTest extends SecurityTestCase
{
    use CreatesLibraryInventorySecurityFixtures;

    public function test_library_and_inventory_policies_are_registered(): void
    {
        $this->assertInstanceOf(BookPolicy::class, Gate::getPolicyFor(Book::class));
        $this->assertInstanceOf(BookIssuePolicy::class, Gate::getPolicyFor(BookIssue::class));
        $this->assertInstanceOf(BookReservationPolicy::class, Gate::getPolicyFor(BookReservation::class));
        $this->assertInstanceOf(InventoryCategoryPolicy::class, Gate::getPolicyFor(InventoryCategory::class));
        $this->assertInstanceOf(InventoryItemPolicy::class, Gate::getPolicyFor(InventoryItem::class));
        $this->assertInstanceOf(InventoryPurchasePolicy::class, Gate::getPolicyFor(InventoryPurchase::class));
        $this->assertInstanceOf(InventoryIssuePolicy::class, Gate::getPolicyFor(InventoryIssue::class));
        $this->assertInstanceOf(AssetPolicy::class, Gate::getPolicyFor(Asset::class));
        $this->assertInstanceOf(AssetMaintenanceLogPolicy::class, Gate::getPolicyFor(AssetMaintenanceLog::class));
    }

    public function test_existing_permissions_map_to_library_and_inventory_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $librarian = $this->createLibraryInventorySecurityUser('librarian', $school, ['library.view', 'library.manage', 'library.issue']);
        $manager = $this->createLibraryInventorySecurityUser('store-manager', $school, ['inventory.view', 'inventory.manage', 'inventory.issue']);
        $book = $this->createLibraryBook($school);
        $category = $this->createInventoryCategory($school);
        $item = $this->createInventoryItem($school, $category);
        $asset = $this->createAsset($school);

        $this->assertTrue(Gate::forUser($librarian)->allows('viewAny', Book::class));
        $this->assertTrue(Gate::forUser($librarian)->allows('update', $book));
        $this->assertTrue(Gate::forUser($manager)->allows('viewAny', InventoryItem::class));
        $this->assertTrue(Gate::forUser($manager)->allows('update', $item));
        $this->assertTrue(Gate::forUser($manager)->allows('maintain', $asset));
    }

    public function test_cross_tenant_records_and_related_records_are_denied_before_permission(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createLibraryInventorySecurityUser('school-admin', $schoolA, ['library.manage', 'library.issue', 'inventory.manage', 'inventory.issue']);
        $bookB = $this->createLibraryBook($schoolB);
        $studentB = $this->createLibraryStudent($schoolB);
        $categoryB = $this->createInventoryCategory($schoolB);
        $itemB = $this->createInventoryItem($schoolB, $categoryB);
        $assetB = $this->createAsset($schoolB);

        $this->assertFalse(Gate::forUser($user)->allows('update', $bookB));
        $this->assertFalse(Gate::forUser($user)->allows('update', $itemB));
        $this->assertFalse(Gate::forUser($user)->allows('maintain', $assetB));
        $this->assertNotSame($schoolA->id, $studentB->school_id);
    }

    public function test_missing_suspended_and_super_admin_contexts_fail_closed(): void
    {
        $school = $this->createSecuritySchool();
        $book = $this->createLibraryBook($school);
        $noTenant = $this->createLibraryInventorySecurityUser('librarian', null, ['library.view']);
        $suspendedSchool = $this->createSecuritySchool(['status' => 'suspended']);
        $suspended = $this->createLibraryInventorySecurityUser('store-manager', $suspendedSchool, ['inventory.view']);
        $superAdmin = $this->createLibraryInventorySecurityUser('super-admin', null, ['library.view', 'inventory.view']);

        $this->assertFalse(Gate::forUser($noTenant)->allows('viewAny', Book::class));
        $this->assertFalse(Gate::forUser($suspended)->allows('viewAny', InventoryItem::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('view', $book));
    }

    public function test_unrecognized_polymorphic_types_fail_closed(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createLibraryInventorySecurityUser('librarian', $school, ['library.view']);
        $book = $this->createLibraryBook($school);
        $issue = $this->createBookIssue($school, $book, $this->createLibraryStudent($school));
        $issue->member_type = 'App\\Models\\User';
        $issue->saveQuietly();

        $this->assertFalse(Gate::forUser($user)->allows('view', $issue));
    }
}
