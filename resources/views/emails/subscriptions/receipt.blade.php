@extends('emails.layouts.eduflow')

@section('content')
    <div style="text-align: right; margin-bottom: 16px;">
        <span class="badge badge-success">Payment Received</span>
    </div>

    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">Invoice & Payment Receipt</h2>
    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px;">Thank you for your payment. Here is the official receipt for your institutional subscription.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 12px; color: #475569; border-collapse: collapse;">
            <tr>
                <td style="padding: 4px 0;"><strong>Billed To:</strong></td>
                <td style="text-align: right; color: #0f172a; font-weight: 600;">{{ $school->name }}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0;"><strong>Receipt / Ref:</strong></td>
                <td style="text-align: right; font-family: monospace; color: #6366f1;">{{ $reference ?? 'EDF-' . strtoupper(substr(md5($subscription->id . now()), 0, 8)) }}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0;"><strong>Billing Period:</strong></td>
                <td style="text-align: right; color: #0f172a;">{{ \Carbon\Carbon::parse($subscription->start_date)->format('M d, Y') }} &ndash; {{ \Carbon\Carbon::parse($subscription->end_date)->format('M d, Y') }}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0;"><strong>Payment Method:</strong></td>
                <td style="text-align: right; color: #0f172a;">{{ $paymentMethod ?? 'Electronic Payment / Paystack' }}</td>
            </tr>
        </table>
    </div>

    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; color: #64748b; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 8px 0;">Subscription Description</th>
                <th style="padding: 8px 0; text-align: center;">Cycle</th>
                <th style="padding: 8px 0; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 14px 0;">
                    <strong style="color: #0f172a; display: block;">{{ $package->name ?? 'EduFlow Premium SaaS' }} Plan</strong>
                    <span style="font-size: 12px; color: #64748b;">Full tenant access &middot; Up to {{ $package->student_limit ?? 'Unlimited' }} Active Students</span>
                </td>
                <td style="padding: 14px 0; text-align: center; color: #64748b; font-size: 12px;">
                    {{ ucfirst($subscription->billing_cycle ?? 'Annual') }}
                </td>
                <td style="padding: 14px 0; text-align: right; font-weight: 700; color: #0f172a;">
                    {{ $school->currency ?? 'KES' }} {{ number_format($amount ?? $package->price ?? 0, 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 13px; color: #475569;">
            <tr>
                <td>Subtotal</td>
                <td style="text-align: right;">{{ $school->currency ?? 'KES' }} {{ number_format($amount ?? $package->price ?? 0, 2) }}</td>
            </tr>
            <tr>
                <td>VAT / Processing (0%)</td>
                <td style="text-align: right;">{{ $school->currency ?? 'KES' }} 0.00</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0; font-size: 15px; font-weight: 800; color: #0f172a;">
                <td style="padding-top: 10px;">Total Paid</td>
                <td style="padding-top: 10px; text-align: right; color: #4f46e5;">{{ $school->currency ?? 'KES' }} {{ number_format($amount ?? $package->price ?? 0, 2) }}</td>
            </tr>
        </table>
    </div>

    <div style="text-align: center; margin-top: 28px;">
        <a href="{{ url('/billing') }}" class="button">Manage Plan & Billing</a>
    </div>
@endsection