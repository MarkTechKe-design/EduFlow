import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Zap, ArrowLeft, CheckCircle2, Radio, Wifi, WifiOff } from 'lucide-react';
import type { PageProps } from '@/types';

interface FixtureItem {
    id: number;
    team_a_score: number | null;
    team_b_score: number | null;
    stage: string;
    venue: string;
    event?: { title: string };
    team_a?: { id: number; name: string };
    team_b?: { id: number; name: string };
}

export default function FieldEntryConsole({
    liveFixtures = [],
    activeEvents = [],
    trackActivities = [],
    houses = [],
    students = [],
    schoolId,
}: PageProps<{
    liveFixtures: FixtureItem[];
    activeEvents: any[];
    trackActivities: any[];
    houses: any[];
    students: any[];
    schoolId?: number;
}>) {
    const [fixtures, setFixtures] = useState<FixtureItem[]>(liveFixtures);
    const [mode, setMode] = useState<'match' | 'track'>('match');
    const [selectedFixture, setSelectedFixture] = useState<FixtureItem | null>(liveFixtures[0] || null);
    const [scoreA, setScoreA] = useState<number>(0);
    const [scoreB, setScoreB] = useState<number>(0);
    const [outcome, setOutcome] = useState<string>('team_a_win');
    const [saving, setSaving] = useState(false);
    const [successNotice, setSuccessNotice] = useState<string | null>(null);
    const [isLiveConnected, setIsLiveConnected] = useState(false);

    // Track mode state
    const [trackEventId, setTrackEventId] = useState(activeEvents[0]?.id ? String(activeEvents[0].id) : '');
    const [trackActivityId, setTrackActivityId] = useState(trackActivities[0]?.id ? String(trackActivities[0].id) : '');
    const [studentId, setStudentId] = useState(students[0]?.id ? String(students[0].id) : '');
    const [houseId, setHouseId] = useState(houses[0]?.id ? String(houses[0].id) : '');
    const [seconds, setSeconds] = useState('');
    const [finishPos, setFinishPos] = useState(1);

    // Synchronize initial fixture selection
    useEffect(() => {
        if (fixtures.length > 0 && (!selectedFixture || !fixtures.find(f => f.id === selectedFixture.id))) {
            handleFixtureSelect(fixtures[0]);
        }
    }, [fixtures]);

    // Real-time WebSocket subscription via Laravel Echo (with graceful fallback)
    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo || !schoolId) {
            setIsLiveConnected(false);
            return;
        }

        try {
            const channel = echo.private(`cocurricular-school.${schoolId}`);
            setIsLiveConnected(true);

            channel.listen('.ScoreUpdated', (e: any) => {
                if (!e || !e.fixture_id) return;

                setFixtures((prev) =>
                    prev.map((f) =>
                        f.id === e.fixture_id
                            ? { ...f, team_a_score: e.team_a_score, team_b_score: e.team_b_score }
                            : f
                    )
                );

                setSelectedFixture((current) => {
                    if (current && current.id === e.fixture_id) {
                        setScoreA(e.team_a_score || 0);
                        setScoreB(e.team_b_score || 0);
                        return { ...current, team_a_score: e.team_a_score, team_b_score: e.team_b_score };
                    }
                    return current;
                });
            });

            return () => {
                channel.stopListening('.ScoreUpdated');
                echo.leave(`cocurricular-school.${schoolId}`);
                setIsLiveConnected(false);
            };
        } catch {
            setIsLiveConnected(false);
        }
    }, [schoolId]);

    function handleFixtureSelect(f: FixtureItem) {
        setSelectedFixture(f);
        setScoreA(f.team_a_score || 0);
        setScoreB(f.team_b_score || 0);
    }

    async function handleScoreSave() {
        if (!selectedFixture) return;
        setSaving(true);
        try {
            const res = await fetch(`/school/cocurricular/field-entry/fixtures/${selectedFixture.id}/quick-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    team_a_score: scoreA,
                    team_b_score: scoreB,
                    outcome: outcome,
                    winner_team_id: outcome === 'team_a_win' ? selectedFixture.team_a?.id : (outcome === 'team_b_win' ? selectedFixture.team_b?.id : null),
                }),
            });
            const data = await res.json();
            if (data.success) {
                // Optimistically update local fixtures list
                setFixtures((prev) =>
                    prev.map((f) =>
                        f.id === selectedFixture.id
                            ? { ...f, team_a_score: scoreA, team_b_score: scoreB }
                            : f
                    )
                );
                setSuccessNotice(`Score published: ${scoreA} - ${scoreB}`);
                setTimeout(() => setSuccessNotice(null), 3000);
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleTrackSave() {
        setSaving(true);
        try {
            const res = await fetch('/school/cocurricular/field-entry/quick-track-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    event_id: trackEventId,
                    activity_id: trackActivityId,
                    student_id: studentId,
                    house_id: houseId,
                    event_round: 'final',
                    metric_type: 'time',
                    time_recorded_seconds: seconds,
                    final_position: finishPos,
                    award_house_points: true,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccessNotice(`Track time saved (${seconds}s). PB & House Standings evaluated.`);
                setSeconds('');
                setTimeout(() => setSuccessNotice(null), 3500);
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout title="Pitchside & Track Field Entry">
            <Head title="Pitchside Rapid Console - EduFlow" />

            <div className="max-w-md mx-auto space-y-4 pb-12">
                {/* Top Nav Bar */}
                <div className="flex items-center justify-between">
                    <Link href="/school/cocurricular" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Hub
                    </Link>
                    <div className="flex items-center gap-2">
                        {isLiveConnected ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                                <Radio className="w-3 h-3 animate-pulse text-emerald-500" /> Live Sync
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                                <Zap className="w-3 h-3 text-amber-500" /> Rapid Console
                            </span>
                        )}
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <button
                        type="button"
                        onClick={() => setMode('match')}
                        className={`py-2 text-xs font-bold rounded-lg transition ${mode === 'match' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Match / Game Score
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('track')}
                        className={`py-2 text-xs font-bold rounded-lg transition ${mode === 'track' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Track / Stopwatch Entry
                    </button>
                </div>

                {successNotice && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {successNotice}
                    </div>
                )}

                {/* 1. MATCH SCORE CONSOLE */}
                {mode === 'match' && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Select Scheduled Fixture</label>
                            <select
                                value={selectedFixture?.id || ''}
                                onChange={e => {
                                    const match = fixtures.find(f => String(f.id) === e.target.value);
                                    if (match) handleFixtureSelect(match);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {fixtures.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.team_a?.name || 'Team A'} vs {f.team_b?.name || 'Team B'} ({f.stage})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedFixture && (
                            <div className="space-y-4 pt-2">
                                {/* Touch Keypad Counters */}
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">{selectedFixture.team_a?.name || 'Team A'}</span>
                                        <div className="text-4xl font-extrabold text-slate-900 dark:text-white my-2">{scoreA}</div>
                                        <div className="flex justify-center gap-2">
                                            <button type="button" onClick={() => setScoreA(Math.max(0, scoreA - 1))} className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-base transition">-</button>
                                            <button type="button" onClick={() => setScoreA(scoreA + 1)} className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition shadow-xs">+</button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">{selectedFixture.team_b?.name || 'Team B'}</span>
                                        <div className="text-4xl font-extrabold text-slate-900 dark:text-white my-2">{scoreB}</div>
                                        <div className="flex justify-center gap-2">
                                            <button type="button" onClick={() => setScoreB(Math.max(0, scoreB - 1))} className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-base transition">-</button>
                                            <button type="button" onClick={() => setScoreB(scoreB + 1)} className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition shadow-xs">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Outcome Status</label>
                                    <select
                                        value={outcome}
                                        onChange={e => setOutcome(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="team_a_win">{selectedFixture.team_a?.name || 'Team A'} Victory</option>
                                        <option value="team_b_win">{selectedFixture.team_b?.name || 'Team B'} Victory</option>
                                        <option value="draw">Draw Match</option>
                                        <option value="postponed">Postponed</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleScoreSave}
                                    disabled={saving}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-60"
                                >
                                    {saving ? 'Recording Score...' : 'Save & Broadcast Score'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. TRACK & FIELD CONSOLE */}
                {mode === 'track' && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Athletics Event</label>
                            <select
                                value={trackEventId}
                                onChange={e => setTrackEventId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {activeEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Track Discipline</label>
                            <select
                                value={trackActivityId}
                                onChange={e => setTrackActivityId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {trackActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Athlete</label>
                            <select
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">House (Points)</label>
                                <select
                                    value={houseId}
                                    onChange={e => setHouseId(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                >
                                    <option value="">No House</option>
                                    {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Finish Rank</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={finishPos}
                                    onChange={e => setFinishPos(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Recorded Time (Seconds)</label>
                            <input
                                type="number"
                                step="0.001"
                                placeholder="e.g. 11.820"
                                value={seconds}
                                onChange={e => setSeconds(e.target.value)}
                                className="w-full px-3 py-2 text-sm font-extrabold text-emerald-600 dark:text-emerald-400 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-center"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleTrackSave}
                            disabled={saving || !seconds}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                        >
                            {saving ? 'Evaluating PB/SR...' : 'Record Time & Sync House'}
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}