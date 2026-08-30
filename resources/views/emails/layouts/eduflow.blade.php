<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'EduFlow Platform Notification' }}</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #0f172a; padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; }
        .header p { margin: 4px 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
        .content { padding: 36px 32px; color: #334155; font-size: 14px; line-height: 1.6; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-success { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .badge-danger { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .badge-warning { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .badge-info { background-color: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
        .callout { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
        .callout-title { font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 6px; display: block; }
        .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; margin: 20px 0; }
        .step-box { background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; font-size: 13px; }
        .footer { background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
        .footer a { color: #4f46e5; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>EduFlow Operations</h1>
                <p>National Cloud School Management System</p>
            </div>
            <div class="content">
                @yield('content')
            </div>
            <div class="footer">
                <p>EduFlow Institutional Operations & Identity Trust Desk</p>
                <p>Need urgent assistance? Contact our Compliance & Support team at <a href="mailto:support@eduflow.co.ke">support@eduflow.co.ke</a> or call +254 700 000 000.</p>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 12px;">This is a system-generated audit email dispatched to registered school administrative officers.</p>
            </div>
        </div>
    </div>
</body>
</html>