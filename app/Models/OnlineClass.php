<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class OnlineClass extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'online_classes';

    protected $fillable = [
        'school_id',
        'class_id',
        'section_id',
        'subject_id',
        'teacher_id',
        'created_by',
        'title',
        'meeting_type', // 'classroom', 'parent_grade', 'parent_general', 'staff', 'board'
        'description',
        'platform',
        'meeting_id',
        'meeting_url',
        'passcode',
        'room_token',
        'scheduled_at',
        'duration_minutes',
        'started_at',
        'ended_at',
        'status',
    ];

    protected $casts = [
        'scheduled_at'     => 'datetime',
        'started_at'       => 'datetime',
        'ended_at'         => 'datetime',
        'duration_minutes' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (OnlineClass $onlineClass) {
            if (empty($onlineClass->room_token)) {
                $onlineClass->room_token = Str::random(32);
            }
            if (empty($onlineClass->meeting_type)) {
                $onlineClass->meeting_type = 'classroom';
            }
            if (empty($onlineClass->meeting_id)) {
                $onlineClass->meeting_id = self::generateSecureJitsiRoomName();
                $domain = config('services.jitsi.domain', 'meet.ffmuc.net');
                $onlineClass->meeting_url = "https://{$domain}/{$onlineClass->meeting_id}";
            }
        });
    }

    public static function generateSecureJitsiRoomName(): string
    {
        return 'EduFlow_' . bin2hex(random_bytes(10));
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function canUserJoin(User $user): bool
    {
        // 1. Strict Tenant Wall
        if ($user->school_id !== $this->school_id && !$user->hasRole('super-admin')) {
            return false;
        }

        if ($user->status !== 'active') {
            return false;
        }

        // 2. School Leadership always has access
        if ($user->hasRole(['super-admin', 'school-admin', 'principal'])) {
            return true;
        }

        $type = $this->meeting_type ?? 'classroom';

        // 3. Staff & Administrative Meetings
        if (in_array($type, ['staff', 'board'])) {
            return $user->hasRole(['teacher', 'school-admin', 'principal', 'board-member']);
        }

        // 4. Parent Meetings (General AGM vs Grade-Specific like PP2)
        if ($type === 'parent_general') {
            return $user->hasRole(['parent', 'guardian', 'teacher', 'school-admin', 'principal']);
        }

        if ($type === 'parent_grade') {
            if ($user->hasRole(['teacher', 'school-admin', 'principal'])) {
                return true;
            }

            if ($user->hasRole(['parent', 'guardian'])) {
                // If meeting is for a specific grade (e.g. PP2), verify parent has a child in that class
                if (!$this->class_id) {
                    return true;
                }

                return Student::where('school_id', $this->school_id)
                    ->where(function ($q) use ($user) {
                        $q->where('parent_id', $user->id)
                          ->orWhere('guardian_id', $user->id)
                          ->orWhere('user_id', $user->id);
                    })
                    ->where('class_id', $this->class_id)
                    ->exists();
            }

            return false;
        }

        // 5. Standard Student Classroom Lessons
        if ($user->hasRole('teacher')) {
            return (int)$this->teacher_id === (int)$user->id || (int)$this->created_by === (int)$user->id;
        }

        if ($user->hasRole('student')) {
            $student = Student::where('user_id', $user->id)
                ->where('school_id', $this->school_id)
                ->first();

            if (!$student || (int)$student->class_id !== (int)$this->class_id) {
                return false;
            }

            if ($this->section_id !== null && $student->section_id !== null) {
                return (int)$student->section_id === (int)$this->section_id;
            }

            return true;
        }

        return false;
    }
}