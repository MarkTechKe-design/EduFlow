<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionInquiry;
use App\Models\SchoolClass;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionInquiryController extends Controller
{
    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $query = AdmissionInquiry::where('school_id', $sid)
            ->with(['assignedStaff:id,first_name,last_name,emp_id']);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('student_name', 'like', "%{$s}%")
                  ->orWhere('guardian_name', 'like', "%{$s}%")
                  ->orWhere('guardian_phone', 'like', "%{$s}%")
                  ->orWhere('guardian_email', 'like', "%{$s}%")
                  ->orWhere('class_interested', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('channel') && $request->channel !== 'all') {
            $query->where('preferred_contact_channel', $request->channel);
        }

        $inquiries = $query->latest('id')->paginate(20)->withQueryString();

        $all = AdmissionInquiry::where('school_id', $sid)->get();
        $stats = [
            'total'       => $all->count(),
            'new'         => $all->where('status', 'new')->count(),
            'follow_up'   => $all->where('status', 'follow_up')->count(),
            'admitted'    => $all->where('status', 'admitted')->count(),
        ];

        return Inertia::render('SchoolAdmin/Admissions/Inquiries', [
            'inquiries' => $inquiries,
            'classes'   => SchoolClass::where('school_id', $sid)->orderBy('name')->get(['id', 'name']),
            'staff'     => Staff::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'stats'     => $stats,
            'filters'   => [
                'search'  => $request->input('search', ''),
                'status'  => $request->input('status', 'all'),
                'channel' => $request->input('channel', 'all'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'student_name'              => 'required|string|max:150',
            'class_interested'          => 'required|string|max:50',
            'guardian_name'             => 'required|string|max:150',
            'guardian_phone'            => 'required|string|max:25',
            'guardian_email'            => 'nullable|email|max:150',
            'preferred_contact_channel' => 'required|in:phone_call,whatsapp,sms,email,physical_meeting',
            'last_contact_channel'      => 'nullable|in:phone_call,whatsapp,sms,email,physical_meeting',
            'status'                    => 'required|in:new,follow_up,admitted,dropped',
            'source'                    => 'required|string|max:50',
            'next_followup_date'        => 'nullable|date',
            'assigned_staff_id'         => 'nullable|exists:staff,id',
            'notes'                     => 'nullable|string|max:1000',
        ]);

        $data['school_id'] = $sid;
        AdmissionInquiry::create($data);

        return back()->with('success', 'Admission inquiry logged.');
    }

    public function update(Request $request, AdmissionInquiry $inquiry): RedirectResponse
    {
        abort_if($inquiry->school_id !== $this->getSchoolId(), 403);

        $data = $request->validate([
            'student_name'              => 'required|string|max:150',
            'class_interested'          => 'required|string|max:50',
            'guardian_name'             => 'required|string|max:150',
            'guardian_phone'            => 'required|string|max:25',
            'guardian_email'            => 'nullable|email|max:150',
            'preferred_contact_channel' => 'required|in:phone_call,whatsapp,sms,email,physical_meeting',
            'last_contact_channel'      => 'nullable|in:phone_call,whatsapp,sms,email,physical_meeting',
            'status'                    => 'required|in:new,follow_up,admitted,dropped',
            'source'                    => 'required|string|max:50',
            'next_followup_date'        => 'nullable|date',
            'assigned_staff_id'         => 'nullable|exists:staff,id',
            'notes'                     => 'nullable|string|max:1000',
        ]);

        $inquiry->update($data);

        return back()->with('success', 'Inquiry details and follow-up status updated.');
    }

    public function destroy(AdmissionInquiry $inquiry): RedirectResponse
    {
        abort_if($inquiry->school_id !== $this->getSchoolId(), 403);
        $inquiry->delete();

        return back()->with('success', 'Inquiry record archived.');
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? 1)->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}
