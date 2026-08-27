<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Certificate of Achievement</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; color: #0f172a; margin: 0; padding: 25px; text-align: center; }
        .cert-border { border: 6px double #059669; padding: 30px; height: 90%; box-sizing: border-box; }
        .cert-header { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #065f46; letter-spacing: 2px; }
        .cert-subtitle { font-size: 13px; text-transform: uppercase; color: #64748b; margin-top: 5px; }
        .cert-body { margin-top: 35px; }
        .cert-awarded-to { font-size: 14px; font-style: italic; color: #475569; }
        .student-name { font-size: 26px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #cbd5e1; display: inline-block; padding: 0 40px 5px 40px; margin: 10px 0; }
        .cert-reason { font-size: 14px; line-height: 1.6; color: #334155; margin: 20px auto; width: 85%; }
        .cert-footer { margin-top: 45px; width: 100%; }
        .sig-col { width: 33.33%; display: inline-block; text-align: center; font-size: 11px; }
        .sig-line { border-top: 1px solid #475569; width: 70%; margin: 30px auto 5px auto; }
    </style>
</head>
<body>
    <div class="cert-border">
        <div class="cert-header">{{ $school->name ?? 'EduFlow School Operations' }}</div>
        <div class="cert-subtitle">Certificate of Co-Curricular Distinction</div>

        <div class="cert-body">
            <div class="cert-awarded-to">This is officially presented to</div>
            <div class="student-name">{{ $achievement->student->first_name }} {{ $achievement->student->last_name }}</div>
            <div style="font-size: 12px; color: #64748b;">Admission Number: {{ $achievement->student->admission_no }} &bull; Class: {{ $achievement->student->schoolClass->name ?? '—' }}</div>

            <div class="cert-reason">
                For exemplary performance and being conferred the award of <strong>{{ $achievement->award_title }}</strong>
                in <strong>{{ $achievement->activity->name ?? 'Co-Curricular Competition' }}</strong>
                at the <strong>{{ ucfirst($achievement->competition_level) }} Level</strong>.
                @if($achievement->citation)
                    <br><em style="font-size: 12px; color: #475569;">"{{ $achievement->citation }}"</em>
                @endif
            </div>
        </div>

        <div class="cert-footer">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td class="sig-col">
                        <div class="sig-line"></div>
                        <strong>Patron / Head Coach</strong><br>
                        {{ $achievement->verifier ? $achievement->verifier->first_name . ' ' . $achievement->verifier->last_name : 'Games Master' }}
                    </td>
                    <td class="sig-col">
                        <div style="margin-top: 20px; font-size: 10px; color: #64748b;">
                            Certificate No: {{ $achievement->certificate_number ?? ('CC-' . date('Y') . '-' . $achievement->id) }}<br>
                            Date: {{ $achievement->awarded_date->format('d F Y') }}
                        </div>
                    </td>
                    <td class="sig-col">
                        <div class="sig-line"></div>
                        <strong>Principal / Head of Institution</strong><br>
                        Official School Seal
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>