<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CBC Learner Summative Report - {{ $student['full_name'] }}</title>
    <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5px; color: #0f172a; line-height: 1.35; }
        .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 8px; margin-bottom: 10px; }
        .title { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #065f46; letter-spacing: 0.5px; }
        .school-name { font-size: 13px; font-weight: bold; color: #1e293b; }
        .meta { font-size: 9px; color: #475569; }
        
        .student-bar { width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin-bottom: 12px; }
        .student-bar td { padding: 4px 8px; font-size: 9.5px; border: 1px solid #e2e8f0; }
        .lbl { font-weight: bold; background: #f0fdf4; color: #166534; width: 18%; }
        
        .rubric-key { width: 100%; margin-bottom: 10px; border-collapse: collapse; background: #f8fafc; border: 1px solid #cbd5e1; }
        .rubric-key td { padding: 4px 8px; font-size: 8.5px; border: 1px solid #e2e8f0; text-align: center; }
        
        .cbc-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .cbc-table th { background: #065f46; color: #ffffff; padding: 5px 6px; font-size: 8.5px; text-transform: uppercase; border: 1px solid #065f46; }
        .cbc-table td { padding: 5px 6px; border: 1px solid #cbd5e1; font-size: 9.5px; }
        .level-check { text-align: center; font-weight: bold; font-size: 11px; }
        
        .comment-card { border: 1px solid #cbd5e1; padding: 6px 8px; margin-bottom: 8px; background: #ffffff; border-radius: 4px; }
        .comment-head { font-size: 8.5px; font-weight: bold; text-transform: uppercase; color: #166534; margin-bottom: 2px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="title">REPUBLIC OF KENYA - MINISTRY OF EDUCATION</div>
        <div class="school-name">{{ $school['name'] }}</div>
        <div class="meta">LEARNER'S COMPETENCY-BASED CURRICULUM (CBC) SUMMATIVE REPORT</div>
    </div>

    <table class="student-bar">
        <tr>
            <td class="lbl">Learner Name:</td>
            <td><strong>{{ $student['full_name'] }}</strong></td>
            <td class="lbl">UPI Number:</td>
            <td>{{ $student['nemis_upi'] ?: $student['admission_no'] }}</td>
        </tr>
        <tr>
            <td class="lbl">Grade & Stream:</td>
            <td>{{ $student['class_name'] }} - {{ $student['section_name'] }}</td>
            <td class="lbl">Assessment Period:</td>
            <td>{{ $exam['name'] }} ({{ $calendar['academic_year'] }})</td>
        </tr>
    </table>

    <table class="rubric-key">
        <tr>
            <td><strong>EE (4):</strong> Exceeding Expectation</td>
            <td><strong>ME (3):</strong> Meeting Expectation</td>
            <td><strong>AE (2):</strong> Approaching Expectation</td>
            <td><strong>BE (1):</strong> Below Expectation</td>
        </tr>
    </table>

    <table class="cbc-table">
        <thead>
            <tr>
                <th style="width: 40%; text-align: left;">Learning Area / Activity</th>
                <th style="width: 10%;">EE (4)</th>
                <th style="width: 10%;">ME (3)</th>
                <th style="width: 10%;">AE (2)</th>
                <th style="width: 10%;">BE (1)</th>
                <th style="width: 20%; text-align: left;">Facilitator Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($subjects as $sub)
                <tr>
                    <td><strong>{{ $sub['subject_name'] }}</strong></td>
                    <td class="level-check">{{ in_array($sub['grade'], ['A+', 'A', 'EE']) ? '✓' : '' }}</td>
                    <td class="level-check">{{ in_array($sub['grade'], ['A-', 'B', 'ME']) ? '✓' : '' }}</td>
                    <td class="level-check">{{ in_array($sub['grade'], ['C', 'AE']) ? '✓' : '' }}</td>
                    <td class="level-check">{{ in_array($sub['grade'], ['D', 'F', 'BE']) ? '✓' : '' }}</td>
                    <td>{{ $sub['remarks'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="comment-card">
        <div class="comment-head">Core Competencies & Values Observed</div>
        <div>Demonstrates consistent self-efficacy, active digital literacy, and collaborative leadership in group tasks.</div>
    </div>

    <div class="comment-card">
        <div class="comment-head">Class Facilitator's Remarks</div>
        <div>{{ $summary['class_teacher_remarks'] }}</div>
    </div>

    <div class="comment-card">
        <div class="comment-head">Headteacher's Comments & Next Steps</div>
        <div>{{ $summary['headteacher_remarks'] }} Next Term Resumes: <strong>{{ $calendar['next_term_opening_date'] }}</strong>.</div>
    </div>

    <table style="width: 100%; margin-top: 15px; text-align: center; font-size: 9px;">
        <tr>
            <td style="width: 33%; border-top: 1px dotted #94a3b8; padding-top: 8px;">Class Facilitator Signature</td>
            <td style="width: 33%; border-top: 1px dotted #94a3b8; padding-top: 8px;">Headteacher Signature & Official Stamp</td>
            <td style="width: 33%; border-top: 1px dotted #94a3b8; padding-top: 8px;">Parent / Guardian Signature</td>
        </tr>
    </table>

</body>
</html>