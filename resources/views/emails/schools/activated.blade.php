@extends('emails.layouts.eduflow')

@section('content')
    <div style="margin-bottom: 20px;">
        <span class="badge badge-success">Service Fully Restored</span>
    </div>

    <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Institutional Access Reactivated</h2>
    <p>Dear School Leadership at <strong>{{ $school->name }}</strong>,</p>
    <p>We are pleased to notify you that the administrative hold on your EduFlow school workspace has been lifted. Full operational access has been completely restored for all administrators, teachers, and enrolled students.</p>

    <div class="callout" style="border-left: 4px solid #10b981; background-color: #f0fdf4;">
        <span class="callout-title" style="color: #166534;">Account Status: Active & Operational</span>
        <p style="margin: 0; color: #14532d; font-size: 13px;">
            All system services, background billing schedules, and communication channels are now running normally.
        </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
        <a href="{{ url('/dashboard') }}" class="button" style="background-color: #059669;">Log In to School Workspace</a>
    </div>
@endsection