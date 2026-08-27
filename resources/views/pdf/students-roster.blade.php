<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Official Students Roster - {{ $school->name ?? 'EduFlow' }}</title>
    <style>
        @page {
            margin: 12mm 10mm;
            size: landscape;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 8.5pt;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .school-name {
            font-size: 14pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-title {
            font-size: 10pt;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            margin-top: 2px;
        }
        .meta-text {
            font-size: 7.5pt;
            color: #64748b;
            text-align: right;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        table.data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            text-align: left;
        }
        table.data-table td {
            border: 1px solid #e2e8f0;
            padding: 4.5px 6px;
            font-size: 8pt;
            vertical-align: middle;
        }
        tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-mono { font-family: 'Courier New', monospace; }
        .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-active { background-color: #dcfce7; color: #166534; }
        .badge-inactive { background-color: #f1f5f9; color: #475569; }
        .footer-table {
            width: 100%;
            margin-top: 15px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            font-size: 7.5pt;
            color: #64748b;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <div class="school-name">{{ $school->name ?? 'EduFlow Operations Platform' }}</div>
                <div class="doc-title">Official Learner Enrollment & Civil Registry Roster</div>
            </td>
            <td class="meta-text" style="width: 40%;">
                <div>Generated: <strong>{{ now()->format('d M Y, H:i') }}</strong></div>
                <div>Academic Session: <strong>{{ date('Y') }}</strong> | Total Listed: <strong>{{ count($students) }}</strong></div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 3%;">#</th>
                <th style="width: 12%;">Adm No</th>
                <th style="width: 20%;">Learner Official Name</th>
                <th style="width: 11%;">NEMIS UPI</th>
                <th style="width: 11%;">Birth Cert No</th>
                <th class="text-center" style="width: 6%;">Gender</th>
                <th style="width: 13%;">Class & Stream</th>
                <th style="width: 14%;">Primary Guardian</th>
                <th class="text-center" style="width: 6%;">Type</th>
                <th class="text-center" style="width: 4%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($students as $index => $s)
                @php
                    $fullName = trim(($s->first_name ?? '') . ' ' . ($s->middle_name ?? '') . ' ' . ($s->last_name ?? ''));
                    if (empty($fullName)) $fullName = $s->full_name ?? '-';
                @endphp
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="font-bold font-mono">{{ $s->admission_no ?? '-' }}</td>
                    <td class="font-bold">{{ $fullName }}</td>
                    <td class="font-mono">{{ $s->nemis_upi ?: '-' }}</td>
                    <td class="font-mono">{{ $s->birth_certificate_no ?: '-' }}</td>
                    <td class="text-center">{{ ucfirst($s->gender ?? '-') }}</td>
                    <td>
                        <strong>{{ $s->schoolClass->name ?? $s->class->name ?? 'Unassigned' }}</strong>
                        @if($s->section)
                            <span style="color: #64748b;">({{ $s->section->name }})</span>
                        @endif
                    </td>
                    <td>
                        {{ $s->guardian->name ?? $s->guardian_name ?? '-' }}
                        @if($s->guardian?->phone || $s->guardian_phone)
                            <br><small style="color: #64748b;">{{ $s->guardian?->phone ?? $s->guardian_phone }}</small>
                        @endif
                    </td>
                    <td class="text-center" style="text-transform: capitalize;">{{ str_replace('_', ' ', $s->admission_type ?? 'New') }}</td>
                    <td class="text-center">
                        <span class="badge {{ strtolower($s->status ?? 'active') === 'active' ? 'badge-active' : 'badge-inactive' }}">
                            {{ $s->status ?? 'Active' }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="10" class="text-center" style="padding: 20px; color: #64748b;">
                        No learners registered matching the filter criteria.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="footer-table">
        <tr>
            <td style="width: 50%;">
                EduFlow School Operations Management System &bull; Confidential Administrative Record
            </td>
            <td class="text-right" style="width: 50%;">
                Verified by Principal / Registrar: ___________________________
            </td>
        </tr>
    </table>

</body>
</html>