@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 20px;">
        <span class="badge badge-danger">Verification Action Required</span>
    </div>

    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Identity Verification Requires Rectification</h2>
    <p>Dear Administrator at <strong>{{ $school->name }}</strong>,</p>
    <p>Our regulatory compliance team reviewed the government documentation and registration credentials submitted for your school. At this time, full institutional verification could not be granted.</p>

    <div class="callout" style="border-left: 4px solid #ef4444; background-color: #fff5f5;">
        <span class="callout-title" style="color: #991b1b;">Auditor Findings & Defect Description</span>
        <p style="margin: 0; color: #7f1d1d; font-size: 13px; font-weight: 500;">
            "{{ $reason }}"
        </p>
        <div style="margin-top: 12px; font-size: 11px; color: #991b1b;">
            <strong>Auditor Note Logged:</strong> {{ now()->format('M d, Y H:i T') }}
        </div>
    </div>

    <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px;">Recommended Rectification Steps:</h3>
    <div class="step-box">
        <strong>Step 1:</strong> Log into your EduFlow School Management Console.
    </div>
    <div class="step-box">
        <strong>Step 2:</strong> Navigate to <strong>School Settings &gt; Regulatory Profile</strong>.
    </div>
    <div class="step-box">
        <strong>Step 3:</strong> Update the specific codes or re-upload your valid Ministry of Education (MOE) registration certificate as noted above.
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
        <em>Note: Your day-to-day access to classrooms, fee collections, and timetables remains operational while you address this item.</em>
    </p>

    <div style="text-align: center; margin-top: 24px;">
        <a href="{{ url('/dashboard') }}" class="button" style="background-color: #dc2626;">Review & Update Documentation</a>
    </div>
@endsection