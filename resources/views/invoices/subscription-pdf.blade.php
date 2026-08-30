<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice - {{ $payment->reference }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; font-size: 14px; background: #fff; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 24px; margin-bottom: 30px; }
        .logo-title { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .logo-subtitle { color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600; }
        .badge-paid { display: inline-block; background-color: #ecfdf5; color: #065f46; font-weight: 800; font-size: 12px; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px; }
        .meta-col h4 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .meta-col p { margin: 0; line-height: 1.6; color: #334155; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; padding: 12px 14px; font-size: 11px; text-transform: uppercase; color: #64748b; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        td { padding: 16px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .totals-table { width: 320px; margin-left: auto; border-collapse: collapse; }
        .totals-table td { padding: 8px 0; border: none; }
        .totals-table tr.grand-total td { border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800; color: #0f172a; padding-top: 12px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
        @media print {
            body { padding: 0; }
            .invoice-box { border: none; padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="max-width: 800px; margin: 0 auto 20px; text-align: right;">
        <button onclick="window.print()" style="background-color: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            ??? Print / Save as PDF
        </button>
    </div>

    <div class="invoice-box">
        <div class="header">
            <div>
                <div class="logo-title">EduFlow Platform</div>
                <div class="logo-subtitle">Official SaaS Subscription Tax Invoice</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">EduFlow Systems Ltd &middot; PIN: P051239847Z</div>
            </div>
            <div style="text-align: right;">
                <span class="badge-paid">Paid & Verified</span>
                <div style="font-family: monospace; font-size: 13px; font-weight: 700; color: #6366f1; margin-top: 10px;">{{ $payment->reference }}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: {{ $payment->paid_at ? \Carbon\Carbon::parse($payment->paid_at)->format('F d, Y') : \Carbon\Carbon::parse($payment->created_at)->format('F d, Y') }}</div>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-col">
                <h4>Billed To:</h4>
                <p><strong>{{ $school->name }}</strong></p>
                <p>Attn: {{ $school->billing_email ?? $school->email }}</p>
                @if($school->kra_pin)
                    <p>KRA PIN: <strong>{{ $school->kra_pin }}</strong></p>
                @endif
                <p>{{ $school->billing_address ?? 'Nairobi, Kenya' }}</p>
            </div>
            <div class="meta-col" style="text-align: right;">
                <h4>Subscription Summary:</h4>
                <p>Plan Tier: <strong>{{ $package->name ?? 'EduFlow Standard' }}</strong></p>
                <p>Billing Cycle: <strong>{{ ucfirst($subscription->billing_cycle ?? 'Monthly') }}</strong></p>
                <p>Payment Method: <strong>{{ ucfirst($subscription->payment_method ?? 'Card / Electronic') }}</strong></p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Billing Period</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $package->name ?? 'EduFlow' }} SaaS Plan</strong>
                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                            Full multi-tenant portal access, automated grading, attendance roll call, and fee ledger management.
                        </div>
                    </td>
                    <td style="text-align: center; color: #64748b;">
                        {{ \Carbon\Carbon::parse($subscription->start_date)->format('M d, Y') }} &ndash; {{ \Carbon\Carbon::parse($subscription->end_date)->format('M d, Y') }}
                    </td>
                    <td style="text-align: right; font-weight: 700;">
                        {{ $payment->currency ?? 'KES' }} {{ number_format($payment->amount, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <table class="totals-table">
            <tr>
                <td style="color: #64748b;">Subtotal</td>
                <td style="text-align: right; font-weight: 600;">{{ $payment->currency ?? 'KES' }} {{ number_format($payment->amount, 2) }}</td>
            </tr>
            <tr>
                <td style="color: #64748b;">VAT / Service Tax (0.00%)</td>
                <td style="text-align: right; font-weight: 600;">{{ $payment->currency ?? 'KES' }} 0.00</td>
            </tr>
            <tr class="grand-total">
                <td>Total Paid</td>
                <td style="text-align: right; color: #4f46e5;">{{ $payment->currency ?? 'KES' }} {{ number_format($payment->amount, 2) }}</td>
            </tr>
        </table>

        <div class="footer">
            <p>This is an official electronic tax receipt issued by EduFlow Cloud Operations.</p>
            <p>Support Desk: support@eduflow.co.ke &middot; +254 700 000 000 &middot; Nairobi, Kenya</p>
        </div>
    </div>
</body>
</html>