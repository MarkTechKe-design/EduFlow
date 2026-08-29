<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CBC Learner Report Card - {{ $student['full_name'] }}</title>
    <style>
        /* Base Reset */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
            font-size: 9pt;
            line-height: 1.35;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        /* Screen Control Bar */
        .no-print-toolbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .toolbar-title { font-weight: bold; font-size: 11pt; display: flex; align-items: center; gap: 8px; }
        .toolbar-actions { display: flex; gap: 10px; align-items: center; }
        .btn-action {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 6px 14px;
            font-size: 9pt;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.15s;
        }
        .btn-action:hover { background: #1d4ed8; }
        .btn-emerald { background: #059669; }
        .btn-emerald:hover { background: #047857; }
        .select-template {
            background: #334155;
            color: #ffffff;
            border: 1px solid #475569;
            padding: 5px 10px;
            font-size: 8.5pt;
            border-radius: 6px;
            cursor: pointer;
        }

        /* Report Paper Sheet */
        .report-sheet {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            background: #ffffff;
            padding: 12mm 14mm;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
            position: relative;
        }

        @media print {
            body { background: #ffffff; }
            .no-print-toolbar { display: none !important; }
            .report-sheet {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
            }
            @page {
                size: A4 portrait;
                margin: 10mm 12mm;
            }
        }

        /* Shared Utility Classes */
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-muted { color: #64748b; }

        /* Badges */
        .badge-level {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 600;
        }
        .badge-ee { background: #dcfce7; color: #15803d; }
        .badge-me { background: #e0f2fe; color: #0369a1; }
        .badge-ae { background: #fef3c7; color: #b45309; }
        .badge-be { background: #fee2e2; color: #b91c1c; }
        .badge-mini { font-size: 7pt; padding: 1px 4px; border-radius: 3px; font-weight: bold; margin-left: 3px; }

        /* ----------------------------------------------------
           TEMPLATE A: EXECUTIVE CBE STYLING
        ---------------------------------------------------- */
        .cbe-header-bar {
            background: #065f46;
            color: #ffffff;
            padding: 10px 14px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .cbe-header-left { display: flex; align-items: center; gap: 12px; }
        .cbe-emblem { font-size: 24pt; line-height: 1; }
        .cbe-sub-title { font-size: 7.5pt; letter-spacing: 1px; text-transform: uppercase; color: #a7f3d0; font-weight: 600; }
        .cbe-main-title { font-size: 13pt; font-weight: 800; letter-spacing: 0.5px; }
        .cbe-motto { font-size: 7.5pt; color: #d1fae5; font-style: italic; }
        .cbe-term-badge {
            background: #ffffff;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 4px;
            text-align: center;
            font-weight: 800;
        }
        .term-lbl { font-size: 6.5pt; letter-spacing: 1px; color: #047857; }
        .term-val { font-size: 10pt; font-weight: 900; }

        .cbe-info-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
            font-size: 8.5pt;
        }
        .cbe-info-table td { padding: 4px 8px; border: 1px solid #e2e8f0; }
        .cbe-info-table .lbl { background: #f8fafc; color: #475569; font-weight: 600; width: 15%; }

        .cbe-data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
            font-size: 8.5pt;
        }
        .cbe-data-table th {
            background: #065f46;
            color: #ffffff;
            padding: 5px 8px;
            font-size: 8pt;
            text-transform: uppercase;
            border: 1px solid #065f46;
        }
        .cbe-data-table td { padding: 4px 8px; border: 1px solid #e2e8f0; }
        .cbe-data-table tr:nth-child(even) { background: #f8fafc; }
        .total-row { background: #ecfdf5 !important; border-top: 2px solid #059669; }
        .mean-row { background: #d1fae5 !important; }

        .cbe-comments-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
        }
        .cbe-comments-table td { padding: 3px 8px; border: 1px solid #f1f5f9; }

        .cbe-matrix-grid {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
        }
        .cbe-matrix-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            overflow: hidden;
            background: #ffffff;
        }
        .matrix-head {
            background: #f1f5f9;
            color: #1e293b;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 3px 8px;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .matrix-body { padding: 6px 8px; font-size: 8pt; line-height: 1.4; color: #334155; }

        .cbe-signatures-table { width: 100%; margin-top: 10px; margin-bottom: 10px; text-align: center; }
        .sig-line { border-bottom: 1px dotted #94a3b8; font-weight: bold; padding-bottom: 2px; font-size: 8.5pt; color: #1e293b; margin: 0 10px 3px 10px; }
        .sig-lbl { font-size: 7pt; color: #64748b; }

        .cbe-rubric-footer { margin-top: 6px; }
        .rubric-key-table { width: 100%; border-collapse: collapse; font-size: 7pt; border: 1px solid #cbd5e1; }
        .rubric-key-table th { background: #f8fafc; color: #475569; padding: 2px 6px; border: 1px solid #e2e8f0; font-size: 6.5pt; text-transform: uppercase; }
        .rubric-key-table td { padding: 2px 6px; border: 1px solid #e2e8f0; text-align: center; color: #334155; }
        .cbe-footer-quote { text-align: center; font-size: 7pt; color: #64748b; margin-top: 4px; font-style: italic; }

        /* ----------------------------------------------------
           TEMPLATE B: TRANSCRIPT ANALYTICS STYLING
        ---------------------------------------------------- */
        .transcript-container { font-size: 8.5pt; }
        .transcript-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }
        .transcript-logo .logo-box {
            width: 48px;
            height: 48px;
            border: 2px solid #0f172a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20pt;
            font-weight: 900;
        }
        .transcript-title-box { text-align: center; flex: 1; }
        .doc-badge { font-size: 7.5pt; font-weight: 800; letter-spacing: 1px; color: #475569; }
        .transcript-title-box .school-name { font-size: 14pt; font-weight: 900; color: #0f172a; }
        .school-tel { font-size: 7.5pt; color: #64748b; }
        .student-hero { font-size: 11pt; color: #0f172a; margin-top: 4px; }
        .student-sub { font-size: 8pt; color: #475569; font-weight: 600; }

        .transcript-photo-box .photo-frame {
            width: 52px;
            height: 60px;
            border: 1px solid #cbd5e1;
            padding: 2px;
            border-radius: 4px;
            background: #f8fafc;
        }
        .photo-placeholder {
            width: 100%;
            height: 100%;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18pt;
        }

        .transcript-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #0f172a;
            margin-bottom: 10px;
            font-size: 8.5pt;
        }
        .transcript-table th {
            background: #f1f5f9;
            color: #0f172a;
            padding: 4px 6px;
            font-size: 8pt;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .transcript-table td { padding: 3px 6px; border: 1px solid #e2e8f0; }
        .transcript-summary-bar { background: #f8fafc; font-weight: bold; border-top: 1.5px solid #0f172a; }

        .transcript-comments-grid {
            display: flex;
            gap: 12px;
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            border-radius: 4px;
            margin-bottom: 10px;
            background: #fafafa;
        }
        .comments-left { flex: 1; font-size: 8pt; }
        .comment-group { margin-bottom: 5px; }
        .comment-title { font-weight: bold; text-decoration: underline; color: #1e293b; font-size: 8pt; margin-bottom: 2px; }
        .comment-text { color: #334155; line-height: 1.3; }
        .parent-sign-line { font-size: 7.8pt; color: #475569; margin-top: 6px; }

        .comments-stamp .stamp-box {
            width: 85px;
            height: 70px;
            border: 1.5px dashed #94a3b8;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .stamp-inner { font-size: 6.5pt; font-weight: bold; color: #94a3b8; letter-spacing: 0.5px; }

        .analytics-chart-container {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 10px;
            background: #ffffff;
        }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .chart-title { font-size: 8pt; font-weight: bold; color: #1e293b; text-transform: uppercase; }
        .chart-legend { font-size: 7pt; color: #475569; display: flex; gap: 10px; }
        .legend-item { display: inline-flex; align-items: center; gap: 4px; }
        .legend-box { width: 10px; height: 6px; border-radius: 1px; display: inline-block; }
        .legend-student { background: #3b82f6; }
        .legend-avg { background: #dc2626; }

        .svg-chart-wrapper { width: 100%; height: 90px; }
        .svg-chart { width: 100%; height: 100%; }

        .history-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            font-size: 7.5pt;
            margin-bottom: 8px;
        }
        .history-table th { background: #f1f5f9; padding: 2px 4px; border: 1px solid #e2e8f0; font-size: 7pt; }
        .history-table td { padding: 2px 4px; border: 1px solid #e2e8f0; }

        .transcript-footer { text-align: center; font-size: 7pt; color: #64748b; font-style: italic; }
    </style>
</head>
<body>

    <!-- On-Screen Action Bar -->
    <div class="no-print-toolbar">
        <div class="toolbar-title">
            <span>📄</span>
            <span>CBC Learner Report Card Engine</span>
            <span style="font-size: 8.5pt; color: #94a3b8; font-weight: normal;">({{ $student['full_name'] }})</span>
        </div>
        <div class="toolbar-actions">
            <!-- Template Switcher -->
            <select class="select-template" onchange="window.location.href = updateQueryString('template', this.value)">
                <option value="executive" {{ $meta['template'] === 'executive' ? 'selected' : '' }}>Template A: Executive CBE (Emerald Standard)</option>
                <option value="transcript" {{ $meta['template'] === 'transcript' ? 'selected' : '' }}>Template B: Junior Transcript (With Analytics Chart)</option>
            </select>

            <!-- PDF Download -->
            <a href="{{ request()->fullUrlWithQuery(['export' => 'pdf']) }}" class="btn-action btn-emerald" target="_blank">
                <span>⬇</span> Download PDF
            </a>

            <!-- Browser Print -->
            <button class="btn-action" onclick="window.print()">
                <span>🖨</span> Print Clean Report
            </button>
        </div>
    </div>

    <!-- Printable Paper Sheet -->
    <div class="report-sheet">
        @if($meta['template'] === 'transcript')
            @include('reports.cbc.transcript-analytics')
        @else
            @include('reports.cbc.executive-cbe')
        @endif
    </div>

    <script>
        function updateQueryString(key, value) {
            const url = new URL(window.location.href);
            url.searchParams.set(key, value);
            return url.toString();
        }
    </script>
</body>
</html>