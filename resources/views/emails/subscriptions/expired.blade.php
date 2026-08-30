@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 16px;">
        <span class="badge badge-danger">Action Required &middot; Plan Expired</span>
    </div>

    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">Your Subscription Has Ended</h2>
    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px;">
        Dear School Leadership at <strong>{{ $school->name }}</strong>, your active subscription period concluded on <strong>{{ \Carbon\Carbon::parse($subscription->end_date)->format('F d, Y') }}</strong>.
    </p>

    <div class="callout" style="border-left: 4px solid #ef4444; background-color: #fef2f2;">
        <span class="callout-title" style="color: #991b1b;">3-Day Grace Period Active</span>
        <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
            Your tenant data remains securely preserved and intact. A 3-day grace period is currently in effect to allow your institution to complete renewal without operational disruption.
        </p>
    </div>

    <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px;">Reactivate in 1 Click:</h3>
    <p style="font-size: 13px; color: #64748b;">
        Renewing your plan immediately unlocks all portal features and resumes automated parent communication channels.
    </p>

    <div style="text-align: center; margin-top: 28px;">
        <a href="{{ url('/billing') }}" class="button" style="background-color: #dc2626;">Reactivate Workspace Now</a>
    </div>
@endsection