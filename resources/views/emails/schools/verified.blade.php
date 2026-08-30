@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 20px;">
        <span class="badge badge-success">Official Clearance Granted</span>
    </div>

    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Institutional Verification Approved</h2>
    <p>Dear Administrator at <strong>{{ $school->name }}</strong>,</p>
    <p>We are pleased to inform you that your institution has successfully completed the official compliance audit on <strong>EduFlow</strong>. Your school records have been verified against national regulatory standards.</p>

    <div class="callout" style="border-left: 4px solid #10b981;">
        <span class="callout-title" style="color: #065f46;">Auditor Clearance Memo</span>
        <p style="margin: 0; color: #334155; font-size: 13px;">
            {{ $notes ?: 'All submitted regulatory certificates (MOE/KNEC/NEMIS) and administrative profiles have passed identity verification without discrepancy.' }}
        </p>
        <div style="margin-top: 12px; font-size: 11px; color: #64748b;">
            <strong>Verified By:</strong> {{ $auditorName }} &middot; <strong>Audit Date:</strong> {{ now()->format('M d, Y H:i T') }}
        </div>
    </div>

    <h3 style="font-size: 14px; color: #0f172a; margin-top: 24px;">Your Verified Institutional Privileges:</h3>
    <div class="step-box">
        <strong>1. Official Ministry Reporting:</strong> Export regulatory NEMIS/KNEC-compliant student transcripts and performance metrics.
    </div>
    <div class="step-box">
        <strong>2. Unrestricted Bulk Communications:</strong> Authorize parent SMS broadcasts and fee billing dispatches.
    </div>
    <div class="step-box">
        <strong>3. Verified Institution Badge:</strong> Enhanced trust badge displayed across public admission portals and parent receipts.
    </div>

    <div style="text-align: center; margin-top: 24px;">
        <a href="{{ url('/dashboard') }}" class="button">Access Verified Workspace</a>
    </div>
@endsection