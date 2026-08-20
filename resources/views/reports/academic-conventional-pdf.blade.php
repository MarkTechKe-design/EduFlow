<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Academic Report Card - {{ $student['full_name'] }}</title>
    <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; }
        .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .school-name { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .school-motto { font-size: 10px; font-style: italic; color: #475569; }
        .meta-text { font-size: 9px; color: #64748b; }
        
        .student-table { width: 100%; margin-bottom: 14px; border: 1px solid #cbd5e1; border-collapse: collapse; }
        .student-table td { padding: 5px 8px; border: 1px solid #e2e8f0; font-size: 10px; }
        .label { font-weight: bold; color: #475569; width: 18%; background: #f8fafc; }
        .val { color: #0f172a; width: 32%; }
        
        .photo-box { width: 35mm; height: 45mm; border: 1px dashed #94a3b8; text-align: center; vertical-align: middle; background: #f8fafc; }
        .photo-placeholder { font-size: 9px; color: #94a3b8; font-weight: bold; }
        .photo-img { width: 35mm; height: 45mm; object-fit: cover; }
        
        .results-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .results-table th { background: #0f172a; color: #ffffff; padding: 6px 8px; font-size: 9px; text-transform: uppercase; text-align: left; }
        .results-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .summary-grid { width: 100%; border-collapse: collapse; margin-bottom: 14px; background: #f8fafc; border: 1px solid #cbd5e1; }
        .summary-grid td { padding: 6px 10px; font-size: 10px; border: 1px solid #e2e8f0; }
        
        .remarks-box { border: 1px solid #cbd5e1; padding: 8px 10px; margin-bottom: 10px; border-radius: 4px; background: #ffffff; }
        .remarks-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 3px; }
        .remarks-text { font-size: 10px; color: #0f172a; }
        
        .footer-table { width: 100%; margin-top: 20px; border-collapse: collapse; }
        .footer-table td { padding-top: 15px; font-size: 10px; text-align: center; border-top: 1px dotted #94a3b8; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 75%;">
                <div class="school-name">{{ $school['name'] }}</div>
                <div class="school-motto">"{{ $school['motto'] }}"</div>
                <div class="meta-text">
                    {{ $school['address'] }} | Phone: {{ $school['phone'] }} | Email: {{ $school['email'] }}<br>
                    Registration: {{ $school['registration_number'] }} | KNEC Code: {{ $school['knec_code'] }}
                </div>
            </td>
            <td style="width: 25%; text-align: right;">
                @if(!empty($student['photo_url']))
                    <img src="{{ $student['photo_url'] }}" class="photo-img" alt="Photo" />
                @else
                    <div class="photo-box">
                        <span class="photo-placeholder"><br><br>PHOTO SPACE</span>
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <table class="student-table">
        <tr>
            <td class="label">Learner Name:</td>
            <td class="val"><strong>{{ $student['full_name'] }}</strong></td>
            <td class="label">Admission No:</td>
            <td class="val"><strong>{{ $student['admission_no'] }}</strong></td>
        </tr>
        <tr>
            <td class="label">Class & Stream:</td>
            <td class="val">{{ $student['class_name'] }} ({{ $student['section_name'] }})</td>
            <td class="label">Assessment:</td>
            <td class="val">{{ $exam['name'] }}</td>
        </tr>
        <tr>
            <td class="label">Academic Year:</td>
            <td class="val">{{ $calendar['academic_year'] }}</td>
            <td class="label">Attendance:</td>
            <td class="val">{{ $attendance['days_present'] }} / {{ $attendance['total_days'] }} Days ({{ $attendance['attendance_rate'] }}%)</td>
        </tr>
    </table>

    <table class="results-table">
        <thead>
            <tr>
                <th style="width: 10%;">Code</th>
                <th style="width: 35%;">Subject / Learning Area</th>
                <th style="width: 12%; text-align: center;">Score</th>
                <th style="width: 10%; text-align: center;">Out of</th>
                <th style="width: 10%; text-align: center;">%</th>
                <th style="width: 8%; text-align: center;">Grade</th>
                <th style="width: 15%;">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($subjects as $sub)
                <tr>
                    <td>{{ $sub['subject_code'] ?: '—' }}</td>
                    <td><strong>{{ $sub['subject_name'] }}</strong></td>
                    <td class="text-center">{{ $sub['display_mark'] }}</td>
                    <td class="text-center">{{ (int)$sub['full_marks'] }}</td>
                    <td class="text-center">{{ $sub['percentage'] !== null ? $sub['percentage'].'%' : '—' }}</td>
                    <td class="text-center"><strong>{{ $sub['grade'] }}</strong></td>
                    <td>{{ $sub['remarks'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="summary-grid">
        <tr>
            <td><strong>Total Marks:</strong> {{ $summary['total_marks'] }} / {{ $summary['max_possible_marks'] }}</td>
            <td><strong>Average:</strong> {{ $summary['average_percentage'] }}%</td>
            <td><strong>Mean Grade:</strong> {{ $summary['mean_grade'] }}</td>
            <td><strong>Class Position:</strong> {{ $summary['class_position'] ?: '—' }} / {{ $summary['total_students_class'] }}</td>
            <td><strong>Stream Position:</strong> {{ $summary['stream_position'] ?: '—' }} / {{ $summary['total_students_stream'] }}</td>
        </tr>
    </table>

    <div class="remarks-box">
        <div class="remarks-title">Class Teacher's Remarks</div>
        <div class="remarks-text">{{ $summary['class_teacher_remarks'] }}</div>
    </div>

    <div class="remarks-box">
        <div class="remarks-title">Headteacher's / Principal's Remarks</div>
        <div class="remarks-text">{{ $summary['headteacher_remarks'] }}</div>
    </div>

    <table style="width: 100%; margin-top: 8px; font-size: 10px;">
        <tr>
            <td><strong>Term Closing Date:</strong> {{ $calendar['closing_date'] }}</td>
            <td style="text-align: right;"><strong>Next Term Opens:</strong> {{ $calendar['next_term_opening_date'] }}</td>
        </tr>
    </table>

    <table class="footer-table">
        <tr>
            <td style="width: 33%;">Class Teacher Signature</td>
            <td style="width: 33%;">Principal Signature & Stamp</td>
            <td style="width: 33%;">Parent / Guardian Signature</td>
        </tr>
    </table>

</body>
</html>