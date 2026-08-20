<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SessionRevoker
{
    public static function forUser(User $user): void
    {
        if (config('session.driver') !== 'database' || ! Schema::hasTable(config('session.table', 'sessions'))) {
            return;
        }

        DB::table(config('session.table', 'sessions'))
            ->where('user_id', $user->getAuthIdentifier())
            ->delete();
    }
}
