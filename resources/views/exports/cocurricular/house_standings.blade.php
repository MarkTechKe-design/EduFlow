<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Official House Championship Standings</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; line-height: 1.35; margin: 15px; }
        .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 12px; }
        .school-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .doc-title { font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase; margin-top: 2px; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        .data-table th { background-color: #ecfdf5; font-weight: bold; font-size: 9px; text-transform: uppercase; color: #065f46; }
        .rank-badge { font-weight: bold; font-size: 11px; }
        .footer { margin-top: 30px; width: 100%; border-collapse: collapse; }
        .footer td { width: 50%; padding-top: 35px; border-top: 1px dashed #94a3b8; text-align: center; font-size: 9px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">{{ $school->name ?? 'EduFlow School Management Platform' }}</div>
        <div class="doc-title">Official Inter-House Championship Standings</div>
        <div>Cumulative Points Engine &bull; Academic Year: {{ date('Y') }} &bull; Generated: {{ date('d M Y, H:i') }}</div>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">Rank</th>
                <th style="width: 35%;">House Name</th>
                <th style="width: 25%;">House Patron / Master</th>
                <th style="width: 15%; text-align: right;">Total Points</th>
                <th style="width: 15%; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($houses as $index => $house)
                <tr>
                    <td class="rank-badge">#{{ $index + 1 }}</td>
                    <td><strong>{{ $house->name }}</strong><br><span style="color: #64748b; font-size: 8.5px;">"{{ $house->motto ?? 'Excellence' }}"</span></td>
                    <td>{{ $house->patron ? $house->patron->first_name . ' ' . $house->patron->last_name : 'Unassigned' }}</td>
                    <td style="text-align: right; font-weight: bold; font-size: 11px; color: #059669;">{{ number_format($house->total_points, 2) }} pts</td>
                    <td style="text-align: center;">{{ $index === 0 ? 'LEADER' : 'CONTENDER' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; padding: 12px; color: #64748b;">No house standings calculated.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="footer">
        <tr>
            <td><strong>Games Master / Patron Signature</strong></td>
            <td><strong>Principal / Institution Head Seal</strong></td>
        </tr>
    </table>
</body>
</html>