<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlogPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('super-admin');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'author_name' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'in:draft,published,archived'],
            'is_featured' => ['required', 'boolean'],
            'read_time_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}