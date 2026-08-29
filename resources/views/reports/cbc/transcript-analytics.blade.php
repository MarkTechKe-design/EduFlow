<div class="transcript-container">
    <!-- Header with School Brand & Student Avatar -->
    <div class="transcript-header">
        <div class="transcript-logo">
            <div class="logo-box">∑</div>
        </div>
        <div class="transcript-title-box">
            <div class="doc-badge">STUDENT TRANSCRIPT</div>
            <div class="school-name">{{ $school['name'] }}</div>
            <div class="school-tel">Tel: {{ $school['phone'] }} • Email: {{ $school['email'] }}</div>
            <div class="student-hero">
                <strong>{{ $student['admission_no'] }} {{ $student['full_name'] }}</strong>
            </div>
            <div class="student-sub">
                {{ $student['class_name'] }} {{ $student['section_name'] }} • {{ $meta['term'] }} {{ $meta['academic_year'] }}
            </div>
        </div>
        <div class="transcript-photo-box">
            <div class="photo-frame">
                <div class="photo-placeholder">👤</div>
            </div>
        </div>
    </div>

    <!-- Subject Scores Breakdown Table -->
    <table class="transcript-table">
        <thead>
            <tr>
                <th style="width: 8%;">Code</th>
                <th style="width: 22%; text-align: left;">Subject</th>
                <th style="width: 14%;">Marks</th>
                <th style="width: 15%;">Percent & Level</th>
                <th style="width: 13%;">Rank</th>
                <th style="width: 28%; text-align: left;">Comment & Teacher</th>
            </tr>
        </thead>
        <tbody>
            @foreach($learning_areas as $la)
                <tr>
                    <td class="text-center text-muted">{{ $la['code'] }}</td>
                    <td><strong>{{ $la['name'] }}</strong></td>
                    <td class="text-center font-bold">{{ $la['raw_display'] }}</td>
                    <td class="text-center">
                        <strong>{{ (int)$la['percentage'] }}%</strong>
                        <span class="badge-mini badge-{{ strtolower($la['level_short']) }}">{{ $la['level_short'] }}</span>
                    </td>
                    <td class="text-center text-muted">{{ $la['rank'] }}</td>
                    <td>
                        <div style="font-size: 7.8pt;">{{ $la['comment'] }}</div>
                        <div style="font-size: 7pt; color: #64748b; font-weight: bold;">{{ $la['teacher_name'] }}</div>
                    </td>
                </tr>
            @endforeach
            <tr class="transcript-summary-bar">
                <td colspan="2" style="text-align: left; font-weight: bold;">This Term &gt;&gt;</td>
                <td colspan="2" class="text-center">Total Marks: <strong>{{ $summary['total_raw_marks'] }} / {{ $summary['total_possible'] }}</strong></td>
                <td colspan="2" class="text-center">Average: <strong>{{ $summary['mean_percentage'] }}% ({{ $summary['overall_short'] }})</strong> • Rank: <strong>{{ $summary['class_rank'] }}</strong></td>
            </tr>
        </tbody>
    </table>

    <!-- Facilitator Comments & Stamp Area -->
    <div class="transcript-comments-grid">
        <div class="comments-left">
            <div class="comment-group">
                <div class="comment-title">Class Teacher's Comment</div>
                <div class="comment-text">
                    {{ $student['full_name'] }}, achieving this is a good milestone. Continue targeting higher mastery in practical components. ({{ $summary['class_teacher_name'] }})
                </div>
            </div>
            <div class="comment-group">
                <div class="comment-title">Headteacher's Comment</div>
                <div class="comment-text">
                    {{ $summary['headteacher_remarks'] }} Keep the standard high. ({{ $summary['headteacher_name'] }})
                </div>
            </div>
            <div class="parent-sign-line">
                Parent's Signature: ............................................................................
            </div>
        </div>
        <div class="comments-stamp">
            <div class="stamp-box">
                <div class="stamp-inner">
                    OFFICIAL<br>STAMP & SEAL
                </div>
            </div>
        </div>
    </div>

    <!-- Longitudinal Performance Analytics Bar Chart (SVG) -->
    <div class="analytics-chart-container">
        <div class="chart-header">
            <div class="chart-title">Longitudinal Assessment Performance Analytics</div>
            <div class="chart-legend">
                <span class="legend-item"><span class="legend-box legend-student"></span> Student Score</span>
                <span class="legend-item"><span class="legend-box legend-avg"></span> Cohort Average</span>
            </div>
        </div>

        <div class="svg-chart-wrapper">
            <svg viewBox="0 0 600 120" class="svg-chart">
                <!-- Grid Lines -->
                <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="50" x2="580" y2="50" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="80" x2="580" y2="80" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="40" y1="100" x2="580" y2="100" stroke="#cbd5e1" stroke-width="1.5"/>

                <!-- Y Axis Labels -->
                <text x="32" y="24" font-size="8" fill="#94a3b8" text-anchor="end">100</text>
                <text x="32" y="54" font-size="8" fill="#94a3b8" text-anchor="end">75</text>
                <text x="32" y="84" font-size="8" fill="#94a3b8" text-anchor="end">50</text>

                <!-- Bars & Line Plot for 6 Terms -->
                @php
                    $xPositions = [80, 170, 260, 350, 440, 530];
                    $linePoints = [];
                @endphp
                @foreach($analytics['term_trends'] as $i => $pt)
                    @php
                        $x = $xPositions[$i];
                        $barHeight = ($pt['student'] / 100) * 80;
                        $barY = 100 - $barHeight;
                        $lineY = 100 - (($pt['class_avg'] / 100) * 80);
                        $linePoints[] = "{$x},{$lineY}";
                    @endphp
                    <!-- Student Bar -->
                    <rect x="{{ $x - 18 }}" y="{{ $barY }}" width="36" height="{{ $barHeight }}" rx="3" fill="#3b82f6"/>
                    <text x="{{ $x }}" y="{{ $barY - 3 }}" font-size="8" font-weight="bold" fill="#1e3a8a" text-anchor="middle">{{ (int)$pt['student'] }}%</text>
                    <text x="{{ $x }}" y="112" font-size="7.5" fill="#64748b" text-anchor="middle">{{ $pt['label'] }}</text>
                @endforeach

                <!-- Class Average Trend Line -->
                <polyline fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3,3" points="{{ implode(' ', $linePoints) }}"/>
                @foreach($analytics['term_trends'] as $i => $pt)
                    @php
                        $x = $xPositions[$i];
                        $lineY = 100 - (($pt['class_avg'] / 100) * 80);
                    @endphp
                    <circle cx="{{ $x }}" cy="{{ $lineY }}" r="3" fill="#dc2626"/>
                @endforeach
            </svg>
        </div>
    </div>

    <!-- Multi-term History Table -->
    <table class="history-table">
        <thead>
            <tr>
                <th style="width: 10%;">Exam Term</th>
                @foreach($analytics['history'] as $h)
                    <th>{{ $h['term'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-weight: bold; background: #f8fafc;">Marks</td>
                @foreach($analytics['history'] as $h)
                    <td class="text-center">{{ $h['marks'] }}</td>
                @endforeach
            </tr>
            <tr>
                <td style="font-weight: bold; background: #f8fafc;">Rank</td>
                @foreach($analytics['history'] as $h)
                    <td class="text-center">{{ $h['rank'] }}</td>
                @endforeach
            </tr>
        </tbody>
    </table>

    <div class="transcript-footer">
        "Happiness lies in the joy of achievement and the thrill of creative effort" — Franklin D. Roosevelt
    </div>
</div>