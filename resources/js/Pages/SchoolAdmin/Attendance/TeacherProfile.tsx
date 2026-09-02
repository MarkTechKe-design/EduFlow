import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import TeacherProfileDrawer, { TeacherProfileData } from '@/Components/TeacherProfileDrawer';
import { ArrowLeft } from 'lucide-react';

interface Props {
    profile: TeacherProfileData;
    filters: any;
}

export default function TeacherProfile({ profile }: Props) {
    return (
        <AppLayout title={`360° Profile - ${profile.staff.name}`}>
            <Head title={`360° Profile - ${profile.staff.name}`} />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                <div className="flex items-center justify-between">
                    <Link 
                        href="/school/attendance/staff" 
                        className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Back to Staff Attendance
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px]">
                    <TeacherProfileDrawer
                        profile={profile}
                        isOpen={true}
                        onClose={() => {}}
                        isFullPage={true}
                    />
                </div>
            </div>
        </AppLayout>
    );
}