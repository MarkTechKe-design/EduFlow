<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            if (!Schema::hasColumn('blog_posts', 'gallery_images')) {
                $table->json('gallery_images')->nullable()->after('featured_image');
            }
            if (!Schema::hasColumn('blog_posts', 'video_url')) {
                $table->string('video_url')->nullable()->after('gallery_images');
            }
            if (!Schema::hasColumn('blog_posts', 'media_type')) {
                $table->string('media_type')->default('image')->after('video_url');
            }
            if (!Schema::hasColumn('blog_posts', 'source_name')) {
                $table->string('source_name')->nullable()->after('author_name');
            }
            if (!Schema::hasColumn('blog_posts', 'source_url')) {
                $table->string('source_url')->nullable()->after('source_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn(['gallery_images', 'video_url', 'media_type', 'source_name', 'source_url']);
        });
    }
};