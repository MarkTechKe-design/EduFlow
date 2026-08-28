<?php

namespace App\Services;

use App\Models\DataAccessLog;
use Illuminate\Support\Facades\Request;

class OdpcAuditService
{
    public static function log(
        string $action,
        string $resourceType,
        ?int $studentId = null,
        ?int $resourceId = null,
        ?array $details = null,
        ?string $description = null
    ): ?DataAccessLog {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        return DataAccessLog::create([
            'school_id'     => $user->school_id,
            'user_id'       => $user->id,
            'student_id'    => $studentId,
            'action'        => strtoupper($action),
            'resource_type' => $resourceType,
            'resource_id'   => $resourceId,
            'description'   => $description,
            'metadata'      => $details ? json_encode($details) : null,
            'ip_address'    => Request::ip(),
            'user_agent'    => Request::userAgent(),
            'created_at'    => now(),
        ]);
    }
}