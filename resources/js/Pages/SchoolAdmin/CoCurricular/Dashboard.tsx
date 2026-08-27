import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Trophy, Users, Shield, Calendar, Award, ArrowUpRight, Plus, Activity } from 'lucide-react';
import type { PageProps } from '@/types';

interface DashboardProps extends PageProps {
    stats: {
        total_activities: number;
        active_teams: number;
        registered_clubs: number;
        upcoming_events: number;
        total_achievements: number;
    };
    houses: Array<{ id: number; name: string; color_code: string; total_points: number }>;
    upcomingEvents: Array<{ id: number; title: string; start_date: string; venue?: string; activity?: { name: string } }>;
    recentAchievements: Array<{ id: number; award_title: string; award_type: string; awarded_date: string; student: { first_name: string; last_name: string; admission_no: string }; activity?: { name: string } }>;
    categories: Array<{ id: number; name: string; activities_count: number; clubs_count: number }>;
}

export default function CoCurricularDashboard({ stats, houses, upcomingEvents, recentAchievements, categories }: DashboardProps) {
    return (
        <AppLayout header="Co-Curricular & Talent Operations">
            <Head title="Co-Curricular Hub - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header & Quick Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-emerald-600" />
                            Co-Curricular & Talent Management
                        </h1>
                        <p className="text-xs text-slate-500">Institutional hub for sports, athletics, performing arts, STEM competitions, and learner portfolios.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/school/cocurricular/activities" className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                            <Plus className="w-3.5 h-3.5" /> New Activity
                        </Link>
                        <Link href="/school/cocurricular/events" className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                            <Calendar className="w-3.5 h-3.5" /> Schedule Event
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium">Disciplines</span>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total_activities}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium">Active Squads</span>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active_teams}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium">School Clubs</span>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.registered_clubs}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium">Upcoming Events</span>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.upcoming_events}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium">Total Awards</span>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.total_achievements}</div>
                    </div>
                </div>

                {/* House Standings & Live Events */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* House Championship Engine */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-600" /> House Championship Standings
                            </h2>
                            <Link href="/school/cocurricular/houses" className="text-xs font-semibold text-emerald-600 hover:underline">Full Table</Link>
                        </div>
                        <div className="space-y-3">
                            {houses.map((house, idx) => (
                                <div key={house.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: house.color_code || '#10b981' }}></div>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{house.name}</span>
                                    </div>
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{house.total_points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Competitions */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" /> Upcoming Competitions
                            </h2>
                            <Link href="/school/cocurricular/events" className="text-xs font-semibold text-indigo-600 hover:underline">All Events</Link>
                        </div>
                        <div className="space-y-3">
                            {upcomingEvents.map((evt) => (
                                <div key={evt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">{evt.title}</div>
                                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                        <span>{evt.activity?.name || 'Multi-discipline'}</span>
                                        <span>{evt.start_date}</span>
                                    </div>
                                </div>
                            ))}
                            {upcomingEvents.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-6">No scheduled upcoming events.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Honors & Laurels */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Award className="w-4 h-4 text-purple-600" /> Recent Student Laurels
                            </h2>
                            <Link href="/school/cocurricular/talent" className="text-xs font-semibold text-purple-600 hover:underline">Passports</Link>
                        </div>
                        <div className="space-y-3">
                            {recentAchievements.map((ach) => (
                                <div key={ach.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">{ach.award_title}</div>
                                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                        <span>{ach.student.first_name} {ach.student.last_name} ({ach.student.admission_no})</span>
                                        <span className="font-semibold text-emerald-600">{ach.awarded_date}</span>
                                    </div>
                                </div>
                            ))}
                            {recentAchievements.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-6">No recent awards recorded.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}