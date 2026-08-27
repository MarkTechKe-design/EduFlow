<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Official Team Sheet - {{ $team->name }}</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
        .school-name { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0; }
        .doc-title { font-size: 13px; font-weight: bold; color: #475569; margin: 4px 0; text-transform: uppercase; }
        .meta-table { width: 100%; margin-bottom: 14px; border-collapse: collapse; }
        .meta-table td { padding: 4px 0; font-size: 11px; }
        .meta-label { font-weight: bold; color: #475569; width: 18%; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        .data-table th { background-color: #f1f5f9; font-weight: bold; font-size: 10px; text-transform: uppercase; color: #334155; }
        .footer { margin-top: 30px; }
        .signature-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .signature-table td { width: 33.33%; padding-top: 40px; border-top: 1px dashed #94a3b8; text-align: center; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="school-name">{{ $school->name ?? 'EduFlow School Management Platform' }}</h1>
        <div class="doc-title">Official Co-Curricular Team Sheet</div>
        <div>Academic Year: {{ date('Y') }} &bull; Generated: {{ date('d M Y, H:i') }}</div>
    </div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Team Name:</td>
            <td><strong>{{ $team->name }}</strong></td>
            <td class="meta-label">Activity:</td>
            <td>{{ $team->activity->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Age Bracket:</td>
            <td>{{ strtoupper(str_replace('_', ' ', $team->age_group)) }}</td>
            <td class="meta-label">Gender Scope:</td>
            <td>{{ ucfirst($team->gender) }}</td>
        </tr>
        <tr>
            <td class="meta-label">Head Coach:</td>
            <td>{{ $team->coach ? $team->coach->first_name . ' ' . $team->coach->last_name : 'Unassigned' }}</td>
            <td class="meta-label">Team Captain:</td>
            <td>{{ $team->captain ? $team->captain->first_name . ' ' . $team->captain->last_name . ' (' . $team->captain->admission_no . ')' : 'Unassigned' }}</td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 12%;">No.</th>
                <th style="width: 15%;">Adm No.</th>
                <th style="width: 33%;">Student Full Name</th>
                <th style="width: 15%;">Class</th>
                <th style="width: 20%;">Position / Role</th>
            </tr>
        </thead>
        <tbody>
            @forelse($team->members as $index => $member)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td><strong>{{ $member->jersey_number ?? '—' }}</strong></td>
                    <td>{{ $member->student->admission_no ?? '—' }}</td>
                    <td>{{ $member->student ? $member->student->first_name . ' ' . $member->student->last_name : '—' }}</td>
                    <td>{{ $member->student->schoolClass->name ?? '—' }}</td>
                    <td>{{ ucfirst($member->role) }} {{ $member->position_name ? '(' . $member->position_name . ')' : '' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 12px; color: #64748b;">No registered players on this team roster.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <table class="signature-table">
            <tr>
                <td><strong>Head Coach Signature</strong></td>
                <td><strong>Games Master / Patron</strong></td>
                <td><strong>Principal / Official Seal</strong></td>
            </tr>
        </table>
    </div>
</body>
</html>