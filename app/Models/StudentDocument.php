<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocument extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'student_documents';

    protected $fillable = [
        'school_id',
        'student_id',
        'title',
        'category',
        'description',
        'file_path',
        'file_type',
        'file_size',
        'is_confidential',
        'uploaded_by',
    ];

    protected $casts = [
        'is_confidential' => 'boolean',
        'file_size'       => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}