@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 20px;">
        <span class="badge badge-danger">Account Access Suspended</span>
    </div>

    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Temporary Suspension Notice</h2>
    <p>Dear School Leadership at <strong>{{ $school->name }}</strong>,</p>
    <p>Please be advised that administrative and staff access to your EduFlow school workspace has been temporarily suspended by Platform Administration.</p>

    <div class="callout" style="border-left: 4px solid #b91c1c; background-color: #fff1f2;">
        <span class="callout-title" style="color: #9f1239;">Reason for Administrative Suspension</span>
        <p style="margin: 0; color: #881337; font-size: 13px;">
            {{ $reason ?: 'Suspension initiated due to pending institutional subscription renewal, regulatory compliance review, or administrative policy escalation.' }}
        </p>
    </div>

    <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px;">What this means for your institution:</h3>
    <ul style="padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
        <li>Staff, teacher, and student portal logins are temporarily blocked.</li>
        <li><strong>Data Protection:</strong> All academic records, student databases, and financial histories remain securely encrypted and intact. No records are deleted.</li>
        <li>Automated parent SMS and fee reminder triggers are paused.</li>
    </ul>

    <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px;">How to Restore Your Account:</h3>
    <div class="step-box">
        If this suspension is related to billing or documentation audit, please contact your EduFlow Account Manager directly or reply to this notice with your resolution details.
    </div>

    <div style="text-align: center; margin-top: 24px;">
        <a href="mailto:support@eduflow.co.ke?subject=Urgent:%20Account%20Reactivation%20Appeal%20-%20{{ urlencode($school->name) }}" class="button" style="background-color: #be123c;">Contact Account Resolution Desk</a>
    </div>
@endsection