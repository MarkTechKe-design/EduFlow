import { useState } from 'react';
import { usePage, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Truck, Plus, Pencil, Trash2, CheckCircle2, ShieldAlert, MapPin, Users, Wrench, Fuel, Search, UserCheck
} from 'lucide-react';
import type { PageProps, Student, Staff } from '@/types';

interface VehicleItem {
    id: number;
    registration_no: string;
    name: string;
    model?: string;
    type: 'bus' | 'minibus' | 'van' | 'car';
    capacity: number;
    passengers_count?: number;
    driver_name: string;
    driver_phone: string;
    driver_license_no?: string;
    helper_name?: string;
    insurance_expiry?: string;
    inspection_expiry?: string;
    speed_governor_cert?: string;
    status: 'active' | 'maintenance' | 'inactive';
}

interface RouteItem {
    id: number;
    name: string;
    vehicle_id?: number;
    vehicle_name?: string;
    vehicle_reg?: string;
    start_point: string;
    end_point: string;
    stops?: string;
    monthly_fee: number;
    is_active: boolean;
    students_count?: number;
}

interface AllocationItem {
    id: number;
    student_id: number;
    first_name: string;
    last_name: string;
    admission_no: string;
    class_name?: string;
    guardian_phone?: string;
    route_name: string;
    route_fee: number;
    vehicle_name?: string;
    vehicle_reg?: string;
    pickup_point: string;
    dropoff_point: string;
    trip_type: 'morning_only' | 'evening_only' | 'two_way';
    status: string;
}

interface MaintenanceItem {
    id: number;
    vehicle_id: number;
    vehicle_name: string;
    vehicle_reg: string;
    service_type: string;
    service_date: string;
    cost: number;
    odometer_reading?: number;
    garage_vendor?: string;
    notes?: string;
}

interface Props extends PageProps {
    vehicles: VehicleItem[];
    routes: { data: RouteItem[]; current_page: number; last_page: number };
    allocations: { data: AllocationItem[]; current_page: number; last_page: number };
    maintenances: { data: MaintenanceItem[]; current_page: number; last_page: number };
    allVehicles: { id: number; name: string; registration_no: string; capacity: number }[];
    allRoutes: { id: number; name: string; vehicle_id?: number; monthly_fee: number }[];
    students: Student[];
    drivers: Staff[];
    stats: {
        total_vehicles: number;
        active_fleet: number;
        total_capacity: number;
        active_riders: number;
        compliance_alerts: number;
        total_routes: number;
    };
    filters: { vehicle_search?: string; vehicle_status?: string; route_search?: string; manifest_search?: string };
}

function formatStops(stopsRaw?: string): string | null {
    if (!stopsRaw) return null;
    try {
        const parsed = typeof stopsRaw === 'string' && (stopsRaw.startsWith('[') || stopsRaw.startsWith('{')) 
            ? JSON.parse(stopsRaw) 
            : stopsRaw;

        if (Array.isArray(parsed)) {
            return parsed
                .map((s: any) => typeof s === 'object' && s !== null 
                    ? `${s.name || s.stop || ''}${s.pickup_time ? ` (${s.pickup_time})` : ''}`.trim()
                    : String(s).trim()
                )
                .filter(Boolean)
                .join(' › ');
        }
    } catch {
        // Fallback for non-JSON comma-separated strings
    }
    return String(stopsRaw);
}

export default function TransportIndex({
    vehicles = [],
    routes,
    allocations,
    maintenances,
    allVehicles = [],
    allRoutes = [],
    students = [],
    stats,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'vehicles' | 'routes' | 'manifest' | 'maintenance'>('vehicles');

    // Modals
    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
    const [routeModalOpen, setRouteModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);
    const [allocationModalOpen, setAllocationModalOpen] = useState(false);
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

    // Vehicle Form
    const vehicleForm = useForm({
        registration_no: '',
        name: '',
        model: '',
        type: 'bus' as 'bus' | 'minibus' | 'van' | 'car',
        capacity: 45,
        driver_name: '',
        driver_phone: '',
        driver_license_no: '',
        helper_name: '',
        insurance_expiry: '',
        inspection_expiry: '',
        speed_governor_cert: '',
        status: 'active' as 'active' | 'maintenance' | 'inactive',
    });

    // Route Form
    const routeForm = useForm({
        name: '',
        vehicle_id: allVehicles.length > 0 ? String(allVehicles[0].id) : '',
        start_point: 'School Main Gate',
        end_point: '',
        stops: '',
        monthly_fee: '3500',
        is_active: true,
    });

    // Allocation Form
    const allocationForm = useForm({
        student_id: students.length > 0 ? String(students[0].id) : '',
        route_id: allRoutes.length > 0 ? String(allRoutes[0].id) : '',
        vehicle_id: '',
        pickup_point: '',
        dropoff_point: '',
        trip_type: 'two_way' as 'morning_only' | 'evening_only' | 'two_way',
    });

    // Maintenance Form
    const maintenanceForm = useForm({
        vehicle_id: allVehicles.length > 0 ? String(allVehicles[0].id) : '',
        service_type: 'scheduled_service' as 'scheduled_service' | 'repair' | 'inspection' | 'tyres' | 'fuel',
        service_date: new Date().toISOString().split('T')[0],
        cost: '5000',
        odometer_reading: '',
        garage_vendor: '',
        notes: '',
    });

    // Vehicle actions
    function openVehicleCreate() {
        vehicleForm.reset();
        setEditingVehicle(null);
        setVehicleModalOpen(true);
    }

    function openVehicleEdit(v: VehicleItem) {
        setEditingVehicle(v);
        vehicleForm.setData({
            registration_no: v.registration_no,
            name: v.name,
            model: v.model || '',
            type: v.type,
            capacity: v.capacity,
            driver_name: v.driver_name,
            driver_phone: v.driver_phone,
            driver_license_no: v.driver_license_no || '',
            helper_name: v.helper_name || '',
            insurance_expiry: v.insurance_expiry || '',
            inspection_expiry: v.inspection_expiry || '',
            speed_governor_cert: v.speed_governor_cert || '',
            status: v.status,
        });
        setVehicleModalOpen(true);
    }

    function handleVehicleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingVehicle) {
            vehicleForm.put(`/school/transport/vehicles/${editingVehicle.id}`, {
                onSuccess: () => { setVehicleModalOpen(false); vehicleForm.reset(); },
            });
        } else {
            vehicleForm.post('/school/transport/vehicles', {
                onSuccess: () => { setVehicleModalOpen(false); vehicleForm.reset(); },
            });
        }
    }

    function handleVehicleDelete(id: number) {
        if (confirm('Are you sure you want to remove this vehicle from the fleet?')) {
            router.delete(`/school/transport/vehicles/${id}`);
        }
    }

    // Route actions
    function openRouteCreate() {
        routeForm.reset();
        setEditingRoute(null);
        setRouteModalOpen(true);
    }

    function openRouteEdit(r: RouteItem) {
        setEditingRoute(r);
        routeForm.setData({
            name: r.name,
            vehicle_id: r.vehicle_id ? String(r.vehicle_id) : '',
            start_point: r.start_point,
            end_point: r.end_point,
            stops: r.stops || '',
            monthly_fee: String(r.monthly_fee),
            is_active: r.is_active,
        });
        setRouteModalOpen(true);
    }

    function handleRouteSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingRoute) {
            routeForm.put(`/school/transport/routes/${editingRoute.id}`, {
                onSuccess: () => { setRouteModalOpen(false); routeForm.reset(); },
            });
        } else {
            routeForm.post('/school/transport/routes', {
                onSuccess: () => { setRouteModalOpen(false); routeForm.reset(); },
            });
        }
    }

    function handleRouteDelete(id: number) {
        if (confirm('Are you sure you want to archive this transport route zone?')) {
            router.delete(`/school/transport/routes/${id}`);
        }
    }

    // Allocation action
    function handleAllocationSubmit(e: React.FormEvent) {
        e.preventDefault();
        allocationForm.post('/school/transport/allocations', {
            preserveScroll: true,
            onSuccess: () => { setAllocationModalOpen(false); allocationForm.reset(); },
        });
    }

    function handleAllocationDelete(id: number) {
        if (confirm('Are you sure you want to remove this student from the transport route?')) {
            router.delete(`/school/transport/allocations/${id}`, { preserveScroll: true });
        }
    }

    // Maintenance action
    function handleMaintenanceSubmit(e: React.FormEvent) {
        e.preventDefault();
        maintenanceForm.post('/school/transport/maintenances', {
            preserveScroll: true,
            onSuccess: () => { setMaintenanceModalOpen(false); maintenanceForm.reset(); },
        });
    }

    function handleMaintenanceDelete(id: number) {
        if (confirm('Are you sure you want to remove this maintenance entry?')) {
            router.delete(`/school/transport/maintenances/${id}`, { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Transport, Fleet & Route Management">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-indigo-600" />
                            <span>Transport & Fleet Operations</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            School bus fleet, NTSA roadworthiness compliance, transport route zones, passenger manifests, and fleet maintenance.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'vehicles' && (
                            <Button onClick={openVehicleCreate} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Fleet Vehicle
                            </Button>
                        )}
                        {activeTab === 'routes' && (
                            <Button onClick={openRouteCreate} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Create Route Zone
                            </Button>
                        )}
                        {activeTab === 'manifest' && (
                            <Button onClick={() => { allocationForm.reset(); setAllocationModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Enroll Student Rider
                            </Button>
                        )}
                        {activeTab === 'maintenance' && (
                            <Button onClick={() => { maintenanceForm.reset(); setMaintenanceModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Log Service / Fuel
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Bus Fleet</span>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.active_fleet ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.total_vehicles ?? 0}</span></p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Seating Capacity</span>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.total_capacity ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered Student Riders</span>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.active_riders ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NTSA / Compliance Alerts</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.compliance_alerts ?? 0}</p>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-6">
                    <button
                        onClick={() => setActiveTab('vehicles')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'vehicles' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Fleet Vehicles & NTSA Compliance
                    </button>
                    <button
                        onClick={() => setActiveTab('routes')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'routes' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Transport Routes & Zones
                    </button>
                    <button
                        onClick={() => setActiveTab('manifest')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'manifest' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Student Passenger Manifest
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'maintenance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Maintenance & Fuel Log
                    </button>
                </div>

                {/* TAB 1: VEHICLES & COMPLIANCE */}
                {activeTab === 'vehicles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles.map(v => (
                            <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                                        <p className="font-mono text-xs text-indigo-700 font-bold tracking-wide mt-0.5">{v.registration_no}</p>
                                    </div>
                                    <Badge variant="outline" className={`capitalize text-[10px] font-bold ${v.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : v.status === 'maintenance' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                                        {v.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Driver</span>
                                        <strong>{v.driver_name}</strong>
                                        <div className="text-[10px] font-mono text-slate-500">{v.driver_phone}</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Seating Load</span>
                                        <strong className="text-indigo-600">{v.passengers_count ?? 0}</strong> / {v.capacity} seats
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Inspection Expiry:</span>
                                        <span className="font-mono font-medium text-slate-800">{v.inspection_expiry || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Insurance Expiry:</span>
                                        <span className="font-mono font-medium text-slate-800">{v.insurance_expiry || 'Not set'}</span>
                                    </div>
                                    {v.speed_governor_cert && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Governor Cert:</span>
                                            <span className="font-mono text-slate-800">{v.speed_governor_cert}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <Button size="sm" variant="outline" onClick={() => openVehicleEdit(v)} className="h-7 text-xs font-bold rounded-lg border-slate-200">
                                        <Pencil className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleVehicleDelete(v.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 2: ROUTES & ZONES */}
                {activeTab === 'routes' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Route Zone Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Assigned Vehicle</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Start & End Points</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Termly Fee (KES)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Enrolled Students</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {routes.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No transport routes registered.
                                        </TableCell>
                                    </TableRow>
                                ) : routes.data.map(r => (
                                    <TableRow key={r.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-900">{r.name}</p>
                                            {(() => {
                                                const formatted = formatStops(r.stops);
                                                return formatted ? (
                                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                        Stops: <span className="text-slate-700">{formatted}</span>
                                                    </p>
                                                ) : null;
                                            })()}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            {r.vehicle_name ? (
                                                <div>
                                                    <span className="font-bold text-slate-800">{r.vehicle_name}</span>
                                                    <span className="block font-mono text-[10px] text-slate-400">{r.vehicle_reg}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-600">
                                            <div>{r.start_point} › {r.end_point}</div>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                            KES {Number(r.monthly_fee).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                                            {r.students_count ?? 0} riders
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="outline" onClick={() => openRouteEdit(r)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200">
                                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleRouteDelete(r.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 3: STUDENT MANIFEST */}
                {activeTab === 'manifest' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Student Passenger</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Route Zone</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Assigned Bus</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Pick-up / Drop-off Point</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Trip Schedule</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {allocations.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No students currently allocated to bus routes.
                                        </TableCell>
                                    </TableRow>
                                ) : allocations.data.map(item => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-900">{item.first_name} {item.last_name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">Adm: {item.admission_no} • {item.class_name ?? '—'}</p>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-800">{item.route_name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">KES {Number(item.route_fee).toLocaleString()}</p>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            {item.vehicle_name ? (
                                                <div>
                                                    <span className="font-bold text-slate-800">{item.vehicle_name}</span>
                                                    <span className="block text-[10px] font-mono text-slate-400">{item.vehicle_reg}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-700">
                                            <div>Pick: {item.pickup_point}</div>
                                            <div>Drop: {item.dropoff_point}</div>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-indigo-50 text-indigo-800 border-indigo-200">
                                                {item.trip_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => handleAllocationDelete(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 4: MAINTENANCE & FUEL */}
                {activeTab === 'maintenance' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Fleet Vehicle</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Service Type</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Cost (KES)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Garage / Notes</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {maintenances.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No maintenance or fuel records logged.
                                        </TableCell>
                                    </TableRow>
                                ) : maintenances.data.map(m => (
                                    <TableRow key={m.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-900">{m.vehicle_name}</p>
                                            <p className="text-[10px] font-mono text-slate-400">{m.vehicle_reg}</p>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 capitalize font-semibold text-indigo-900">
                                            {m.service_type.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono text-slate-600">{m.service_date}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-red-600">KES {Number(m.cost).toLocaleString()}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-600">
                                            <p className="font-bold text-slate-800">{m.garage_vendor || 'In-house'}</p>
                                            {m.notes && <p className="text-[10px] text-slate-400">{m.notes}</p>}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => handleMaintenanceDelete(m.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD/EDIT VEHICLE */}
            <Dialog open={vehicleModalOpen} onOpenChange={setVehicleModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editingVehicle ? 'Edit Fleet Vehicle' : 'Register New Fleet Vehicle'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleVehicleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Vehicle Name / Label *</Label>
                                <Input value={vehicleForm.data.name} onChange={e => vehicleForm.setData('name', e.target.value)} placeholder="e.g. Yellow Bus 01" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Number Plate (Reg No.) *</Label>
                                <Input value={vehicleForm.data.registration_no} onChange={e => vehicleForm.setData('registration_no', e.target.value)} placeholder="e.g. KDC 123X" className="h-9 text-xs mt-1 font-mono uppercase" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Vehicle Type *</Label>
                                <Select value={vehicleForm.data.type} onValueChange={(v: any) => vehicleForm.setData('type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bus">School Bus</SelectItem>
                                        <SelectItem value="minibus">Minibus / Matatu</SelectItem>
                                        <SelectItem value="van">Van</SelectItem>
                                        <SelectItem value="car">Staff Car</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Seating Capacity *</Label>
                                <Input type="number" value={vehicleForm.data.capacity} onChange={e => vehicleForm.setData('capacity', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Status *</Label>
                                <Select value={vehicleForm.data.status} onValueChange={(v: any) => vehicleForm.setData('status', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Driver Name *</Label>
                                <Input value={vehicleForm.data.driver_name} onChange={e => vehicleForm.setData('driver_name', e.target.value)} placeholder="Driver full name" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Driver Phone *</Label>
                                <Input value={vehicleForm.data.driver_phone} onChange={e => vehicleForm.setData('driver_phone', e.target.value)} placeholder="07XXXXXXXX" className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">NTSA Inspection Expiry</Label>
                                <Input type="date" value={vehicleForm.data.inspection_expiry} onChange={e => vehicleForm.setData('inspection_expiry', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Insurance Expiry</Label>
                                <Input type="date" value={vehicleForm.data.insurance_expiry} onChange={e => vehicleForm.setData('insurance_expiry', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setVehicleModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={vehicleForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Vehicle</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: ADD/EDIT ROUTE */}
            <Dialog open={routeModalOpen} onOpenChange={setRouteModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">{editingRoute ? 'Edit Route Zone' : 'Create Transport Route Zone'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRouteSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Route Name / Zone *</Label>
                            <Input value={routeForm.data.name} onChange={e => routeForm.setData('name', e.target.value)} placeholder="e.g. Westlands - Parklands Route" className="h-9 text-xs mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Assigned Bus</Label>
                                <Select value={routeForm.data.vehicle_id} onValueChange={v => routeForm.setData('vehicle_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
                                    <SelectContent>
                                        {allVehicles.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name} ({v.registration_no})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Termly Fee (KES) *</Label>
                                <Input type="number" value={routeForm.data.monthly_fee} onChange={e => routeForm.setData('monthly_fee', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Start Location *</Label>
                                <Input value={routeForm.data.start_point} onChange={e => routeForm.setData('start_point', e.target.value)} className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">End Location *</Label>
                                <Input value={routeForm.data.end_point} onChange={e => routeForm.setData('end_point', e.target.value)} className="h-9 text-xs mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Key Pick-up Stops (Comma-separated)</Label>
                            <Input value={routeForm.data.stops} onChange={e => routeForm.setData('stops', e.target.value)} placeholder="e.g. Stage A, Shell Petrol Station, Mall" className="h-9 text-xs mt-1" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setRouteModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={routeForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Route</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: ENROLL STUDENT RIDER */}
            <Dialog open={allocationModalOpen} onOpenChange={setAllocationModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Enroll Student into Bus Service</DialogTitle></DialogHeader>
                    <form onSubmit={handleAllocationSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Student *</Label>
                            <Select value={allocationForm.data.student_id} onValueChange={v => allocationForm.setData('student_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Route Zone *</Label>
                                <Select value={allocationForm.data.route_id} onValueChange={v => allocationForm.setData('route_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select route..." /></SelectTrigger>
                                    <SelectContent>
                                        {allRoutes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Trip Schedule *</Label>
                                <Select value={allocationForm.data.trip_type} onValueChange={(v: any) => allocationForm.setData('trip_type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="two_way">Two-way (Morning & Evening)</SelectItem>
                                        <SelectItem value="morning_only">Morning Pick-up Only</SelectItem>
                                        <SelectItem value="evening_only">Evening Drop-off Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Pick-up Location *</Label>
                                <Input value={allocationForm.data.pickup_point} onChange={e => allocationForm.setData('pickup_point', e.target.value)} placeholder="e.g. Estate Gate" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Drop-off Location *</Label>
                                <Input value={allocationForm.data.dropoff_point} onChange={e => allocationForm.setData('dropoff_point', e.target.value)} placeholder="e.g. School Gate" className="h-9 text-xs mt-1" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setAllocationModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={allocationForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Enroll Rider</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: RECORD MAINTENANCE */}
            <Dialog open={maintenanceModalOpen} onOpenChange={setMaintenanceModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Record Vehicle Maintenance / Fuel</DialogTitle></DialogHeader>
                    <form onSubmit={handleMaintenanceSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Fleet Vehicle *</Label>
                            <Select value={maintenanceForm.data.vehicle_id} onValueChange={v => maintenanceForm.setData('vehicle_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select vehicle..." /></SelectTrigger>
                                <SelectContent>
                                    {allVehicles.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name} ({v.registration_no})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Service Type *</Label>
                                <Select value={maintenanceForm.data.service_type} onValueChange={(v: any) => maintenanceForm.setData('service_type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled_service">Scheduled Service</SelectItem>
                                        <SelectItem value="repair">Mechanical Repair</SelectItem>
                                        <SelectItem value="inspection">NTSA Inspection Fee</SelectItem>
                                        <SelectItem value="tyres">Tyres & Brakes</SelectItem>
                                        <SelectItem value="fuel">Fuel Refill</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Service Cost (KES) *</Label>
                                <Input type="number" step="0.01" value={maintenanceForm.data.cost} onChange={e => maintenanceForm.setData('cost', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Service Date *</Label>
                                <Input type="date" value={maintenanceForm.data.service_date} onChange={e => maintenanceForm.setData('service_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Odometer (KM)</Label>
                                <Input type="number" value={maintenanceForm.data.odometer_reading} onChange={e => maintenanceForm.setData('odometer_reading', e.target.value)} placeholder="e.g. 120500" className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Service Garage / Fuel Station</Label>
                            <Input value={maintenanceForm.data.garage_vendor} onChange={e => maintenanceForm.setData('garage_vendor', e.target.value)} placeholder="e.g. AutoCare Garage Nairobi" className="h-9 text-xs mt-1" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setMaintenanceModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={maintenanceForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Record</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}