@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 20px;">
        <span class="badge badge-info">Workspace Ready</span>
    </div>

    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Welcome to EduFlow Operations</h2>
    <p>Dear <strong>{{ $admin->name }}</strong>,</p>
    <p>Congratulations! Workspace setup for <strong>{{ $school->name }}</strong> is complete. Your institutional tenant environment is calibrated and ready for daily operations.</p>

    <div class="callout" style="border-left: 4px solid #6366f1;">
        <span class="callout-title">Calibrated Institutional Profile:</span>
        <table style="width: 100%; font-size: 12px; color: #334155; margin-top: 6px;">
            <tr><td style="padding: 3px 0; color: #64748b;">Curriculum:</td><td><strong>{{ strtoupper($school->curriculum ?? 'CBC') }}</strong></td></tr>
            <tr><td style="padding: 3px 0; color: #64748b;">Active Session:</td><td><strong>{{ $academicYear->name ?? date('Y') }}</strong></td></tr>
            <tr><td style="padding: 3px 0; color: #64748b;">Timezone & Currency:</td><td><strong>{{ $school->timezone }} ({{ $school->currency }})</strong></td></tr>
        </table>
    </div>

    <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px;">Recommended Next Steps to Launch:</h3>
    <div class="step-box">
        <strong>1. Setup Grade Levels & Streams:</strong> Configure your classes, streams, and subject allocations.
    </div>
    <div class="step-box">
        <strong>2. Student & Parent Admission:</strong> Bulk import student records and link guardian contact numbers.
    </div>
    <div class="step-box">
        <strong>3. Fee Structure Structure:</strong> Configure voteheads, termly tuition rates, and transport routes.
    </div>

    <div style="text-align: center; margin-top: 24px;">
        <a href="{{ url('/dashboard') }}" class="button">Launch School Dashboard</a>
    </div>
@endsection