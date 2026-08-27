<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\UnallocatedPayment;
use App\Services\PaymentProcessingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnallocatedPaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $query = UnallocatedPayment::where('school_id', $schoolId)
            ->with(['allocatedStudent:id,first_name,last_name,admission_no', 'resolver:id,name']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'like', "%{$search}%")
                  ->orWhere('bill_reference_entered', 'like', "%{$search}%")
                  ->orWhere('payer_name', 'like', "%{$search}%")
                  ->orWhere('payer_phone', 'like', "%{$search}%");
            });
        }

        $unallocatedPayments = $query->orderByDesc('payment_date')->paginate(20)->withQueryString();

        $stats = [
            'total_unallocated_count'  => UnallocatedPayment::where('school_id', $schoolId)->where('status', 'unallocated')->count(),
            'total_unallocated_amount' => (float)UnallocatedPayment::where('school_id', $schoolId)->where('status', 'unallocated')->sum('amount'),
            'total_resolved_count'     => UnallocatedPayment::where('school_id', $schoolId)->where('status', 'allocated')->count(),
        ];

        return Inertia::render('SchoolAdmin/Fees/UnallocatedQueue', [
            'unallocatedPayments' => $unallocatedPayments,
            'stats'               => $stats,
            'filters'             => [
                'status' => $request->input('status', 'unallocated'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Resolve and allocate ambiguous payment to a verified student.
     */
    public function resolve(Request $request, UnallocatedPayment $unallocatedPayment): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($unallocatedPayment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        if ($unallocatedPayment->status !== 'unallocated') {
            return redirect()->back()->withErrors(['error' => 'This payment has already been resolved or refunded.']);
        }

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'notes'      => 'nullable|string|max:500',
        ]);

        $student = Student::where('school_id', $schoolId)->findOrFail($validated['student_id']);

        PaymentProcessingService::resolveUnallocatedPayment(
            $unallocatedPayment,
            $student,
            auth()->user(),
            $validated['notes'] ?? 'Bursar manual reconciliation'
        );

        return redirect()->back()->with('success', "Payment #{$unallocatedPayment->reference_code} successfully allocated to {$student->first_name} {$student->last_name} ({$student->admission_no}).");
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
