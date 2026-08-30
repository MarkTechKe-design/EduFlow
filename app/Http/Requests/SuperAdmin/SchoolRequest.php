<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('super-admin');
    }

    public function rules(): array
    {
        $schoolId = $this->route('school')?->id;

        return [
            'name'                => ['required', 'string', 'max:255'],
            'slug'                => ['nullable', 'string', 'max:100', Rule::unique('schools', 'slug')->ignore($schoolId)],
            'email'               => ['nullable', 'email', 'max:255'],
            'phone'               => ['nullable', 'string', 'max:30'],
            'address'             => ['nullable', 'string', 'max:500'],
            'city'                => ['nullable', 'string', 'max:100'],
            'county'              => ['nullable', 'string', 'max:100'],
            'sub_county'          => ['nullable', 'string', 'max:100'],
            'state'               => ['nullable', 'string', 'max:100'],
            'country'             => ['nullable', 'string', 'size:2'],
            'timezone'            => ['nullable', 'string', 'max:50'],
            'currency'            => ['nullable', 'string', 'max:10'],
            'language'            => ['nullable', 'string', 'max:10'],
            'curriculum'          => ['nullable', 'string', 'max:50'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'knec_code'           => ['nullable', 'string', 'max:50'],
            'nemis_code'          => ['nullable', 'string', 'max:50'],
            'status'              => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'verification_status' => ['nullable', Rule::in(['pending', 'verified', 'rejected'])],
            'verification_notes'  => ['nullable', 'string', 'max:5000'],
        ];
    }
}