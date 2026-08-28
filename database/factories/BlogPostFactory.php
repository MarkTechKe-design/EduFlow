<?php

namespace Database\Factories;

use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BlogPostFactory extends Factory
{
    protected $model = BlogPost::class;

    public function definition(): array
    {
        $title = $this->faker->sentence();
        return [
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::random(5),
            'excerpt' => $this->faker->paragraph(),
            'body' => '<p>' . implode('</p><p>', $this->faker->paragraphs(3)) . '</p>',
            'category' => 'School Operations',
            'author_name' => $this->faker->name(),
            'status' => 'published',
            'is_featured' => false,
            'read_time_minutes' => 4,
            'meta_title' => $title,
            'meta_description' => $this->faker->sentence(),
            'published_at' => now(),
        ];
    }
}