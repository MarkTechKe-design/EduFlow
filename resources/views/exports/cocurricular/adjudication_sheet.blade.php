<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Official Performance Adjudication Scorecard</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; line-height: 1.35; margin: 15px; }
        .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 12px; }
        .school-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .doc-title { font-size: 12px; font-weight: bold; color: #7c3aed; text-transform: uppercase; margin-top: 2px; }
        .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .meta-grid td { padding: 3px 0; font-size: 10px; }
        .label { font-weight: bold; color: #475569; width: 20%; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; }
        .data-table th { background-color: #f5f3ff; font-weight: bold; font-size: 9px; text-transform: uppercase; color: #5b21b6; }
        .total-row td { background-color: #f8fafc; font-weight: bold; font-size: 11px; }
        .comments-box { border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; margin-top: 10px; background-color: #fafafa; }
        .footer { margin-top: 25px; width: 100%; border-collapse: collapse; }
        .footer td { width: 50%; padding-top: 35px; border-top: 1px dashed #94a3b8; text-align: center; font-size: 9px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">{{ $school->name ?? 'EduFlow School Management Platform' }}</div>
        <div class="doc-title">Official Performance Adjudication Scorecard</div>
        <div>Adjudicator Assessment &bull; Date: {{ date('d M Y') }}</div>
    </div>

    <table class="meta-grid">
        <tr>
            <td class="label">Performer / Delegate:</td>
            <td><strong>{{ $adjudication->participant->student->first_name ?? 'Delegate' }} {{ $adjudication->participant->student->last_name ?? '' }} ({{ $adjudication->participant->student->admission_no ?? '—' }})</strong></td>
            <td class="label">Event / Festival:</td>
            <td>{{ $adjudication->participant->event->title ?? 'Competition Gala' }}</td>
        </tr>
        <tr>
            <td class="label">Rubric Applied:</td>
            <td>{{ $adjudication->rubric->name ?? 'Standard Assessment Rubric' }}</td>
            <td class="label">Adjudicator:</td>
            <td><strong>{{ $adjudication->adjudicator_name }}</strong></td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 8%;">#</th>
                <th style="width: 42%;">Criterion Description</th>
                <th style="width: 15%; text-align: right;">Max Score</th>
                <th style="width: 15%; text-align: right;">Awarded Score</th>
                <th style="width: 20%;">Adjudicator Comments</th>
            </tr>
        </thead>
        <tbody>
            @forelse($adjudication->itemScores as $index => $score)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td><strong>{{ $score->rubricItem->criterion_name ?? 'Criterion' }}</strong></td>
                    <td style="text-align: right;">{{ number_format($score->rubricItem->max_score ?? 0, 2) }}</td>
                    <td style="text-align: right; font-weight: bold; color: #7c3aed;">{{ number_format($score->awarded_score, 2) }}</td>
                    <td>{{ $score->item_comment ?? '—' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; padding: 12px; color: #64748b;">No itemized score criteria recorded.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2">AGGREGATE PERFORMANCE SCORE</td>
                <td style="text-align: right;">{{ number_format($adjudication->rubric->total_max_score ?? 100, 2) }}</td>
                <td style="text-align: right; color: #7c3aed;">{{ number_format($adjudication->total_awarded_score, 2) }}</td>
                <td><strong>Grade: {{ $adjudication->grade_attained ?? 'Pass' }}</strong></td>
            </tr>
        </tbody>
    </table>

    @if($adjudication->general_feedback)
        <div class="comments-box">
            <strong>General Adjudicator Feedback:</strong>
            <p style="margin: 4px 0 0 0;">{{ $adjudication->general_feedback }}</p>
        </div>
    @endif

    <table class="footer">
        <tr>
            <td><strong>Adjudicator Signature</strong><br>{{ $adjudication->adjudicator_name }}</td>
            <td><strong>Chief Adjudicator / Panel Convener</strong><br>Official Examination Signature</td>
        </tr>
    </table>
</body>
</html>