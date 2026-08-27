<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Official Event Entry & Accreditation Roster</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; line-height: 1.35; margin: 15px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .school-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .doc-title { font-size: 12px; font-weight: bold; color: #0284c7; text-transform: uppercase; margin-top: 2px; }
        .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .meta-grid td { padding: 3px 0; font-size: 10px; }
        .label { font-weight: bold; color: #475569; width: 18%; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; }
        .data-table th { background-color: #f1f5f9; font-weight: bold; font-size: 9px; text-transform: uppercase; color: #334155; }
        .footer { margin-top: 25px; width: 100%; border-collapse: collapse; }
        .footer td { width: 33.33%; padding-top: 35px; border-top: 1px dashed #94a3b8; text-align: center; font-size: 9px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">{{ $school->name ?? 'EduFlow School Management Platform' }}</div>
        <div class="doc-title">Official Event Entry & Accreditation Sheet</div>
        <div>Competition Level: {{ ucfirst($event->competition_level) }} &bull; Generated: {{ date('d M Y, H:i') }}</div>
    </div>

    <table class="meta-grid">
        <tr>
            <td class="label">Event Title:</td>
            <td><strong>{{ $event->title }}</strong></td>
            <td class="label">Discipline / Category:</td>
            <td>{{ $event->activity->name ?? ($event->category->name ?? 'Open Festival') }}</td>
        </tr>
        <tr>
            <td class="label">Venue & Host:</td>
            <td>{{ $event->venue ?? 'Main Campus' }} ({{ $event->host_organization ?? 'Internal' }})</td>
            <td class="label">Event Date(s):</td>
            <td>{{ $event->start_date ? $event->start_date->format('d M Y') : '—' }} to {{ $event->end_date ? $event->end_date->format('d M Y') : '—' }}</td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 14%;">Reg / Bib No.</th>
                <th style="width: 14%;">Adm No.</th>
                <th style="width: 32%;">Participant Name</th>
                <th style="width: 15%;">Class / Stream</th>
                <th style="width: 20%;">Heat / Lane / Role</th>
            </tr>
        </thead>
        <tbody>
            @forelse($event->participants as $index => $participant)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td><strong>{{ $participant->registration_number ?? ('BIB-' . str_pad($participant->id, 3, '0', STR_PAD_LEFT)) }}</strong></td>
                    <td>{{ $participant->student->admission_no ?? '—' }}</td>
                    <td>{{ $participant->student ? $participant->student->first_name . ' ' . $participant->student->last_name : ($participant->team->name ?? 'Team Delegate') }}</td>
                    <td>{{ $participant->student->schoolClass->name ?? '—' }}</td>
                    <td>
                        @if($participant->heat || $participant->lane)
                            Heat {{ $participant->heat ?? '1' }} / Lane {{ $participant->lane ?? '—' }}
                        @else
                            {{ ucfirst($participant->qualification_status) }}
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 12px; color: #64748b;">No delegates registered on this entry sheet.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="footer">
        <tr>
            <td><strong>Lead Coach / Patron Signature</strong></td>
            <td><strong>Games Master / Organizing Secretary</strong></td>
            <td><strong>Principal / Institution Head Seal</strong></td>
        </tr>
    </table>
</body>
</html>