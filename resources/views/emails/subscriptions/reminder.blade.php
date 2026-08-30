@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 16px;">
        <span class="badge badge-warning">Renewal Notice &middot; {{ $daysLeft }} {{ \Illuminate\Support\Str::plural('Day', $daysLeft) }} Left</span>
    </div>

    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">Your Subscription Renews Soon</h2>
    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px;">
        Hello {{ $admin->name ?? 'Administrator' }}, this is a friendly reminder that your <strong>{{ $package->name ?? 'EduFlow' }}</strong> subscription for <strong>{{ $school->name }}</strong> will expire on <strong>{{ \Carbon\Carbon::parse($subscription->end_date)->format('F d, Y') }}</strong>.
    </p>

    <div class="callout" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
        <span class="callout-title" style="color: #92400e;">Upcoming Expiration Timeline</span>
        <p style="margin: 0; color: #78350f; font-size: 13px;">
            To ensure uninterrupted parent fee collections, online student report card generation, and daily staff attendance tracking, please verify your renewal payment prior to the expiry date.
        </p>
    </div>

    <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px;">Included with Your Active Subscription:</h3>
    <div class="step-box">
        <span style="color: #10b981; font-weight: bold; margin-right: 6px;">&#10004;</span><strong>Uninterrupted Portal Access:</strong> Continuous access for all registered teachers, bursars, and administrators.
    </div>
    <div class="step-box">
        <span style="color: #10b981; font-weight: bold; margin-right: 6px;">&#10004;</span><strong>Secure Cloud Backups:</strong> Automated daily backups of student grades and financial audit logs.
    </div>
    <div class="step-box">
        <span style="color: #10b981; font-weight: bold; margin-right: 6px;">&#10004;</span><strong>Compliance Exports:</strong> Export NEMIS and KNEC-formatted regulatory examination records anytime.
    </div>

    <div style="text-align: center; margin-top: 28px;">
        <a href="{{ url('/billing') }}" class="button" style="background-color: #d97706;">Review & Renew Subscription</a>
    </div>
@endsection