import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Calendar, Plus, Trophy } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function FixturesIndex({ fixtures, events, teams }: PageProps<{ fixtures: PaginatedData<any>; events: any[]; teams: any[] }>) {
    const [open, setOpen] = useState(false);
    const [scoreOpen, setScoreOpen] = useState(false);
    const [selectedFixture, setSelectedFixture] = useState<any | null>(null);

    const form = useForm({
        event_id: events[0]?.id ? String(events[0].id) : '',
        team_a_id: teams[0]?.id ? String(teams[0].id) : '',
        team_b_id: teams[1]?.id ? String(teams[1].id) : '',
        scheduled_at: new Date().toISOString().slice(0, 16),
        venue: 'Main Field',
        stage: 'group',
        referee_name: '',
    });

    const scoreForm = useForm({
        team_a_score: 0,
        team_b_score: 0,
        outcome: 'team_a_win',
        match_report: '',
    });

    function openScoreModal(f: any) {
        setSelectedFixture(f);
        scoreForm.setData({
            team_a_score: f.team_a_score || 0,
            team_b_score: f.team_b_score || 0,
            outcome: f.outcome || 'team_a_win',
            match_report: f.match_report || '',
        });
        setScoreOpen(true);
    }

    function handleScoreSubmit(e: React.FormEvent) {
        e.preventDefault();
        scoreForm.put(`/school/cocurricular/sports/fixtures/${selectedFixture.id}/score`, {
            onSuccess: () => setScoreOpen(false),
        });
    }

    return (
        <AppLayout header="Sports Fixtures & Match Results">
            <Head title="Fixtures - EduFlow Sports" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" /> Fixtures & Tournaments
                        </h1>
                        <p className="text-xs text-slate-500">Track matches, friendly ties, and tournament progression.</p>
                    </div>
                    <button onClick={() => setOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Schedule Fixture
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Competition</th>
                                <th className="p-4">Teams (Matchup)</th>
                                <th className="p-4">Date & Venue</th>
                                <th className="p-4">Stage</th>
                                <th className="p-4">Result</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {fixtures.data.map((f) => (
                                <tr key={f.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{f.event?.title}</td>
                                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                                        {f.team_a?.name || f.team_a_custom_name} vs {f.team_b?.name || f.team_b_custom_name}
                                    </td>
                                    <td className="p-4 text-slate-500">{new Date(f.scheduled_at).toLocaleDateString()} &bull; {f.venue}</td>
                                    <td className="p-4 uppercase text-[11px] font-bold text-slate-400">{f.stage}</td>
                                    <td className="p-4 font-bold text-indigo-600">
                                        {f.team_a_score !== null ? `${f.team_a_score} - ${f.team_b_score}` : 'Pending'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => openScoreModal(f)} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold rounded text-slate-700 dark:text-slate-200">
                                            Score
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {scoreOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Record Match Score</h2>
                        <form onSubmit={handleScoreSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Team A Score</label>
                                    <input type="number" min="0" value={scoreForm.data.team_a_score} onChange={e => scoreForm.setData('team_a_score', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Team B Score</label>
                                    <input type="number" min="0" value={scoreForm.data.team_b_score} onChange={e => scoreForm.setData('team_b_score', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Outcome</label>
                                <select value={scoreForm.data.outcome} onChange={e => scoreForm.setData('outcome', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    <option value="team_a_win">Team A Victory</option>
                                    <option value="team_b_win">Team B Victory</option>
                                    <option value="draw">Draw</option>
                                    <option value="postponed">Postponed</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setScoreOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={scoreForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save Score</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}