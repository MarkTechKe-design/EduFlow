<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CocurricularEvent extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'cocurricular_events';

    protected $fillable = [
        'school_id',
        'activity_id',
        'category_id',
        'academic_year_id',
        'term',
        'title',
        'event_type',
        'competition_level',
        'start_date',
        'end_date',
        'venue',
        'host_organization',
        'registration_deadline',
        'adjudicator_names',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date'            => 'date',
        'end_date'              => 'date',
        'registration_deadline' => 'date',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ActivityCategory::class, 'category_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(EventParticipant::class, 'event_id');
    }

    public function fixtures(): HasMany
    {
        return $this->hasMany(ActivityFixture::class, 'event_id')->orderBy('scheduled_at');
    }
}