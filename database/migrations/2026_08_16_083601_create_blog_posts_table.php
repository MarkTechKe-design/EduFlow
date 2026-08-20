<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('blog_posts')) {
            Schema::create('blog_posts', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('excerpt')->nullable();
                $table->longText('body');
                $table->string('category')->default('School Operations');
                $table->string('featured_image')->nullable();
                $table->string('author_name')->default('EduFlow Editorial');
                $table->enum('status', ['draft', 'published', 'archived'])->default('published');
                $table->boolean('is_featured')->default(false);
                $table->unsignedInteger('read_time_minutes')->default(4);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('published_at')->nullable();
                $table->timestamps();

                $table->index(['status', 'published_at']);
                $table->index(['category', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};