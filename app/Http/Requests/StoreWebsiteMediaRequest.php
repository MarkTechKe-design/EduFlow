<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWebsiteMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('website.media') === true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
            'folder' => ['nullable', 'string', 'max:180', 'regex:/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/'],
            'title' => ['nullable', 'string', 'max:180'],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ];
    }
}
