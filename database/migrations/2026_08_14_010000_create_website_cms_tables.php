<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('website_pages')) {
            Schema::create('website_pages', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('title', 180);
            $table->string('slug', 180);
            $table->string('path', 255)->unique();
            $table->string('template', 60)->default('standard');
            $table->string('status', 30)->default('draft')->index();
            $table->boolean('is_home')->default(false)->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamp('unpublished_at')->nullable();
            $table->string('seo_title', 180)->nullable();
            $table->text('seo_description')->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->string('og_image_path', 500)->nullable();
            $table->boolean('robots_index')->default(true);
            $table->boolean('robots_follow')->default(true);
            $table->json('structured_data')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'published_at', 'unpublished_at']);
        });
        }

        if (! Schema::hasTable('website_page_sections')) {
            Schema::create('website_page_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('website_page_id')->constrained('website_pages')->cascadeOnDelete();
            $table->string('block_type', 60);
            $table->string('identifier', 100)->nullable();
            $table->json('content')->nullable();
            $table->json('settings')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['website_page_id', 'is_enabled', 'sort_order'], 'website_sections_page_enabled_order_idx');
        });
        }

        if (! Schema::hasTable('website_menus')) {
            Schema::create('website_menus', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120);
            $table->string('location', 60)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        }

        if (! Schema::hasTable('website_menu_items')) {
            Schema::create('website_menu_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('website_menu_id')->constrained('website_menus')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('website_menu_items')->nullOnDelete();
            $table->string('label', 120);
            $table->string('url', 500)->nullable();
            $table->string('route_name', 180)->nullable();
            $table->string('target', 20)->default('_self');
            $table->string('icon', 80)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->index(['website_menu_id', 'parent_id', 'is_visible', 'sort_order'], 'website_menu_items_visibility_idx');
        });
        }

        if (! Schema::hasTable('website_media')) {
            Schema::create('website_media', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('disk', 60)->default('public');
            $table->string('path', 500);
            $table->string('file_name', 255);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size')->default(0);
            $table->string('folder', 180)->nullable()->index();
            $table->string('title', 180)->nullable();
            $table->string('alt_text', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['mime_type', 'folder']);
        });
        }

        if (! Schema::hasTable('website_leads')) {
            Schema::create('website_leads', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('type', 40)->index();
            $table->string('status', 30)->default('new')->index();
            $table->string('name', 150);
            $table->string('email', 180)->index();
            $table->string('phone', 40)->nullable();
            $table->string('organization', 180)->nullable();
            $table->text('message')->nullable();
            $table->json('payload')->nullable();
            $table->string('source', 120)->nullable();
            $table->string('ip_hash', 128)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('handled_at')->nullable();
            $table->timestamps();
        });
        }

        if (! Schema::hasTable('website_redirects')) {
            Schema::create('website_redirects', function (Blueprint $table): void {
            $table->id();
            $table->string('from_path', 255)->unique();
            $table->string('to_url', 500);
            $table->unsignedSmallInteger('status_code')->default(301);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'from_path']);
        });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('website_redirects');
        Schema::dropIfExists('website_leads');
        Schema::dropIfExists('website_media');
        Schema::dropIfExists('website_menu_items');
        Schema::dropIfExists('website_menus');
        Schema::dropIfExists('website_page_sections');
        Schema::dropIfExists('website_pages');
    }
};
