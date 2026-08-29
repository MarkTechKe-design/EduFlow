<div class="cbe-report-container">
    <!-- Header Banner -->
    <div class="cbe-header-bar">
        <div class="cbe-header-left">
            <div class="cbe-emblem">🇰🇪</div>
            <div>
                <div class="cbe-sub-title">COMPETENCY-BASED EDUCATION (CBE)</div>
                <div class="cbe-main-title">LEARNER'S CURRENT REPORT CARD</div>
                <div class="cbe-motto">{{ $school['motto'] }}</div>
            </div>
        </div>
        <div class="cbe-term-badge">
            <div class="term-lbl">TERM</div>
            <div class="term-val">{{ strtoupper($meta['term']) }}</div>
        </div>
    </div>

    <!-- Student Metadata Strip -->
    <table class="cbe-info-table">
        <tr>
            <td class="lbl">School:</td>
            <td class="val" style="width: 40%;"><strong>{{ $school['name'] }}</strong></td>
            <td class="lbl">Year:</td>
            <td class="val"><strong>{{ $meta['academic_year'] }}</strong></td>
        </tr>
        <tr>
            <td class="lbl">Learner's Name:</td>
            <td class="val"><strong>{{ $student['full_name'] }}</strong></td>
            <td class="lbl">Grade & Stream:</td>
            <td class="val">{{ $student['class_name'] }} - {{ $student['section_name'] }}</td>
        </tr>
        <tr>
            <td class="lbl">UPI / NEMIS No:</td>
            <td class="val">{{ $student['nemis_upi'] }}</td>
            <td class="lbl">Admission No:</td>
            <td class="val"><strong>{{ $student['admission_no'] }}</strong></td>
        </tr>
    </table>

    <!-- Main Learning Areas Table -->
    <table class="cbe-data-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 32%; text-align: left;">Learning Area</th>
                <th style="width: 33%;">Actual Performance Level</th>
                <th style="width: 15%;">Raw Marks (%)</th>
                <th style="width: 15%;">Points</th>
            </tr>
        </thead>
        <tbody>
            @foreach($learning_areas as $la)
                <tr>
                    <td class="text-center">{{ $la['index'] }}</td>
                    <td><strong>{{ $la['name'] }}</strong></td>
                    <td>
                        <span class="badge-level badge-{{ strtolower($la['level_short']) }}">
                            {{ $la['level_code'] }} ({{ $la['level_name'] }})
                        </span>
                    </td>
                    <td class="text-center font-bold">{{ (int)$la['percentage'] }}%</td>
                    <td class="text-center">{{ number_format($la['points'], 1) }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="3" style="text-align: right; font-weight: bold; text-transform: uppercase;">Total Score</td>
                <td class="text-center"><strong>{{ $summary['total_raw_marks'] }} / {{ $summary['total_possible'] }}</strong></td>
                <td class="text-center"><strong>{{ number_format($summary['mean_points'] * count($learning_areas), 1) }}</strong></td>
            </tr>
            <tr class="mean-row">
                <td colspan="3" style="text-align: right; font-weight: bold; text-transform: uppercase;">Mean Points & Level</td>
                <td class="text-center"><strong>{{ $summary['mean_percentage'] }}% ({{ $summary['overall_short'] }})</strong></td>
                <td class="text-center"><strong>{{ number_format($summary['mean_points'], 2) }}</strong></td>
            </tr>
        </tbody>
    </table>

    <!-- Subject Teachers Comments Table -->
    <table class="cbe-comments-table">
        <thead>
            <tr>
                <th colspan="2" style="text-align: left; background: #e2e8f0; color: #1e293b; padding: 4px 8px; font-size: 8.5pt;">
                    TEACHERS' LEARNING AREA COMMENTS
                </th>
            </tr>
        </thead>
        <tbody>
            @foreach($learning_areas as $la)
                <tr>
                    <td style="width: 28%; font-weight: bold; color: #065f46; font-size: 8pt; vertical-align: top;">
                        {{ $la['name'] }}:
                    </td>
                    <td style="font-size: 8pt; color: #334155;">
                        {{ $la['comment'] }} <span style="font-size: 7.5pt; color: #64748b;">— {{ $la['teacher_name'] }}</span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Attendance, Conduct & Remarks Matrix -->
    <div class="cbe-matrix-grid">
        <!-- Attendance -->
        <div class="cbe-matrix-box" style="width: 25%;">
            <div class="matrix-head">ATTENDANCE</div>
            <div class="matrix-body">
                <div>Days Present: <strong>{{ $summary['attendance']['days_present'] }}</strong></div>
                <div>Days Absent: <strong>{{ $summary['attendance']['days_absent'] }}</strong></div>
                <div>Total Days: <strong>{{ $summary['attendance']['total_days'] }}</strong></div>
            </div>
        </div>

        <!-- Conduct -->
        <div class="cbe-matrix-box" style="width: 25%;">
            <div class="matrix-head">LEARNER'S CONDUCT</div>
            <div class="matrix-body">
                <div>Behaviour: <strong>{{ $summary['conduct']['behaviour'] }}</strong></div>
                <div>Effort: <strong>{{ $summary['conduct']['effort'] }}</strong></div>
                <div>Rank in Stream: <strong>{{ $summary['class_rank'] }}</strong></div>
            </div>
        </div>

        <!-- General Remarks -->
        <div class="cbe-matrix-box" style="width: 46%;">
            <div class="matrix-head">FACILITATOR & PRINCIPAL GENERAL REMARKS</div>
            <div class="matrix-body" style="font-size: 7.8pt;">
                <div><strong>Class Teacher:</strong> {{ $summary['teacher_remarks'] }}</div>
                <div style="margin-top: 3px;"><strong>Headteacher:</strong> {{ $summary['headteacher_remarks'] }}</div>
            </div>
        </div>
    </div>

    <!-- Signatures Row -->
    <table class="cbe-signatures-table">
        <tr>
            <td style="width: 32%;">
                <div class="sig-line">Ms. P. Akinyi</div>
                <div class="sig-lbl">Class Facilitator Signature</div>
            </td>
            <td style="width: 36%;">
                <div class="sig-line">{{ $summary['headteacher_name'] }}</div>
                <div class="sig-lbl">Headteacher Signature & Official Stamp</div>
            </td>
            <td style="width: 32%;">
                <div class="sig-line">{{ $student['guardian_name'] }}</div>
                <div class="sig-lbl">Parent / Guardian Signature</div>
            </td>
        </tr>
    </table>

    <!-- Performance Level Rubric Key Footer -->
    <div class="cbe-rubric-footer">
        <table class="rubric-key-table">
            <thead>
                <tr>
                    <th>Performance Level</th>
                    <th>Actual Performance Level</th>
                    <th>Raw Marks (%)</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Exceeding Expectation</td><td>EE1 / EE2</td><td>75 - 100%</td><td>3.5 - 4.0</td></tr>
                <tr><td>Meeting Expectation</td><td>ME1 / ME2</td><td>41 - 74%</td><td>2.5 - 3.0</td></tr>
                <tr><td>Approaching Expectation</td><td>AE1 / AE2</td><td>21 - 40%</td><td>1.5 - 2.0</td></tr>
                <tr><td>Below Expectation</td><td>BE1 / BE2</td><td>01 - 20%</td><td>0.5 - 1.0</td></tr>
            </tbody>
        </table>
        <div class="cbe-footer-quote">
            "Together We Learn, Grow and Succeed" • Generated on {{ $meta['issue_date'] }}
        </div>
    </div>
</div>