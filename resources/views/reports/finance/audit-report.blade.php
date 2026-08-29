<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }} — {{ $school['name'] }}</title>
    <style>
        @page { size: A4 portrait; margin: 12mm 14mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 8.5pt;
            color: #0f172a;
            line-height: 1.35;
            background: #ffffff;
        }

        .header {
            border-bottom: 2px solid #0f766e;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .school-title { font-size: 14pt; font-weight: 800; color: #0f766e; text-transform: uppercase; }
        .report-subtitle { font-size: 11pt; font-weight: 700; color: #1e293b; margin-top: 2px; }
        .school-meta { font-size: 8pt; color: #475569; margin-top: 2px; }
        .badge-audit {
            background: #0f766e;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .summary-kpi-grid {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        .kpi-card {
            flex: 1;
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            border-radius: 4px;
            background: #f8fafc;
        }
        .kpi-lbl { font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .kpi-val { font-size: 11pt; font-weight: 800; color: #0f172a; margin-top: 2px; }

        table.audit-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            margin-bottom: 12px;
        }
        table.audit-table th {
            background: #0f766e;
            color: #ffffff;
            padding: 5px 8px;
            font-size: 7.5pt;
            text-transform: uppercase;
            border: 1px solid #0f766e;
            text-align: left;
        }
        table.audit-table td {
            padding: 4px 8px;
            border: 1px solid #e2e8f0;
            font-size: 8pt;
        }
        table.audit-table tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .total-bar { background: #ccfbf1 !important; font-weight: bold; border-top: 2px solid #0f766e; }

        .signatures {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
        }
        .sig-block { width: 30%; text-align: center; }
        .sig-line { border-bottom: 1px dotted #64748b; padding-bottom: 2px; font-weight: bold; margin-bottom: 4px; }
        .sig-title { font-size: 7pt; color: #64748b; }

        .footer {
            margin-top: 15px;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    <div class="header">
        <div>
            <div class="school-title">{{ $school['name'] }}</div>
            <div class="report-subtitle">{{ $title }}</div>
            <div class="school-meta">
                Tel: {{ $school['phone'] ?? '+254 700 000 000' }} • Email: {{ $school['email'] }} • Period: {{ $period }}
            </div>
        </div>
        <div>
            <div class="badge-audit">OFFICIAL AUDIT REPORT</div>
        </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="summary-kpi-grid">
        <div class="kpi-card">
            <div class="kpi-lbl">Total Records</div>
            <div class="kpi-val">{{ count($records) }}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-lbl">Total Value (KES)</div>
            <div class="kpi-val">KES {{ number_format($total_amount, 2) }}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-lbl">Generated On</div>
            <div class="kpi-val">{{ date('d M Y, H:i') }}</div>
        </div>
    </div>

    <!-- Data Table -->
    <table class="audit-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 15%;">Adm / Ref No</th>
                <th style="width: 25%;">Student / Account</th>
                <th style="width: 15%;">Class & Stream</th>
                <th style="width: 20%;">Guardian / Phone</th>
                <th style="width: 20%; text-align: right;">Amount (KES)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($records as $idx => $r)
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td><strong>{{ $r['reference'] ?? $r['admission_no'] }}</strong></td>
                    <td>{{ $r['name'] }}</td>
                    <td>{{ $r['class_name'] }}</td>
                    <td>{{ $r['phone'] ?? 'N/A' }}</td>
                    <td class="text-right font-bold">{{ number_format($r['amount'], 2) }}</td>
                </tr>
            @endforeach
            <tr class="total-bar">
                <td colspan="5" style="text-align: right; text-transform: uppercase;">Total Aggregate</td>
                <td class="text-right">KES {{ number_format($total_amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Audit Validation Signatures -->
    <div class="signatures">
        <div class="sig-block">
            <div class="sig-line">School Bursar / Finance Officer</div>
            <div class="sig-title">Prepared & Verified By</div>
        </div>
        <div class="sig-block">
            <div class="sig-line">Headteacher / Principal</div>
            <div class="sig-title">Authorized Approval & Stamp</div>
        </div>
        <div class="sig-block">
            <div class="sig-line">B.O.M / Finance Committee</div>
            <div class="sig-title">Audit Review Board</div>
        </div>
    </div>

    <div class="footer">
        <div>EduFlow Institutional Management Platform • Confidential Audit Record</div>
        <div>Page 1 of 1</div>
    </div>

</body>
</html>