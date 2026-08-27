<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Jobs\SendPaymentReceiptNotification;
use App\Models\FeeLedgerEntry;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\FeeVoteHead;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\StudentLedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class FeePaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $query = FeePayment::where('school_id', $schoolId);

        if (Schema::hasTable('fee_payment_allocations')) {
            $query->with(['student.schoolClass', 'allocations.voteHead']);
        } else {
            $query->with(['student.schoolClass']);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('receipt_no', 'like', "%{$search}%")
                  ->orWhere('note', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($sq) use ($search) {
                      $sq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('admission_no', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('method') && $request->method !== 'all') {
            $query->where('method', $request->method);
        }

        $payments = $query->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_collections' => (float) FeePayment::where('school_id', $schoolId)->sum('amount_paid'),
            'mpesa_collections' => (float) FeePayment::where('school_id', $schoolId)->where('method', 'mpesa')->sum('amount_paid'),
            'bank_collections'  => (float) FeePayment::where('school_id', $schoolId)->whereIn('method', ['bank_transfer', 'cheque', 'direct_deposit'])->sum('amount_paid'),
            'cash_collections'  => (float) FeePayment::where('school_id', $schoolId)->where('method', 'cash')->sum('amount_paid'),
        ];

        return Inertia::render('SchoolAdmin/Fees/Payments', [
            'payments' => $payments,
            'stats'    => $stats,
            'filters'  => [
                'search' => $request->input('search', ''),
                'method' => $request->input('method', 'all'),
            ],
        ]);
    }

    public function outstanding(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;
        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);

        $query = Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['schoolClass:id,name', 'section:id,name']);

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('admission_no', 'like', "%{$search}%");
            });
        }

        $students = $query->paginate(20)->withQueryString();

        $students->getCollection()->transform(function ($student) use ($schoolId) {
            $student->balance = StudentLedgerService::computeBalance($student->id, $schoolId);
            return $student;
        });

        $totalOutstanding = 0;
        if (Schema::hasTable('fee_ledger_entries')) {
            $totalOutstanding = FeeLedgerEntry::where('school_id', $schoolId)
                ->selectRaw('COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0) as balance')
                ->value('balance') ?? 0;
        } else {
            $due = (float) FeePayment::withoutGlobalScopes()->where('school_id', $schoolId)->sum('amount_due');
            $paid = (float) FeePayment::withoutGlobalScopes()->where('school_id', $schoolId)->sum('amount_paid');
            $totalOutstanding = max(0, $due - $paid);
        }

        return Inertia::render('SchoolAdmin/Fees/Outstanding', [
            'students'         => $students,
            'classes'          => $classes,
            'totalOutstanding' => (float) max(0, (float) $totalOutstanding),
            'filters'          => [
                'search'   => $request->input('search', ''),
                'class_id' => $request->input('class_id', 'all'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;
        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);
        $structures = FeeStructure::where('school_id', $schoolId)->with('schoolClass:id,name')->get();
        $voteHeads = Schema::hasTable('fee_vote_heads')
            ? FeeVoteHead::where('school_id', $schoolId)->where('is_active', true)->get()
            : collect();

        $student = null;
        if ($request->filled('student_id')) {
            $student = Student::where('school_id', $schoolId)
                ->with('schoolClass:id,name')
                ->where(function ($q) use ($request) {
                    $q->where('id', $request->student_id)
                      ->orWhere('admission_no', $request->student_id);
                })
                ->first();
        }

        return Inertia::render('SchoolAdmin/Fees/Collect', [
            'student'    => $student,
            'structures' => $structures,
            'classes'    => $classes,
            'voteHeads'  => $voteHeads,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'student_id'       => 'required|integer',
            'fee_structure_id' => 'nullable|integer',
            'amount_paid'      => 'nullable|numeric|min:0',
            'amount'           => 'nullable|numeric|min:0',
            'amount_due'       => 'nullable|numeric|min:0',
            'discount'         => 'nullable|numeric|min:0',
            'fine'             => 'nullable|numeric|min:0',
            'method'           => 'required|in:mpesa,bank_transfer,cash,cheque,direct_deposit',
            'reference_no'     => 'nullable|string|max:80',
            'payment_date'     => 'required|date',
            'month_year'       => 'nullable|string|max:20',
            'note'             => 'nullable|string|max:500',
        ]);

        $student = Student::where('school_id', $schoolId)->findOrFail($validated['student_id']);

        $feeStructure = null;
        if (!empty($validated['fee_structure_id'])) {
            $feeStructure = FeeStructure::where('school_id', $schoolId)->find($validated['fee_structure_id']);
        }

        $amountPaid = (float) ($validated['amount_paid'] ?? $validated['amount'] ?? 0);
        $amountDue = (float) ($validated['amount_due'] ?? ($feeStructure ? $feeStructure->amount : $amountPaid));
        $discount = (float) ($validated['discount'] ?? 0);
        $fine = (float) ($validated['fine'] ?? 0);

        $status = 'paid';
        if ($amountPaid <= 0) {
            $status = 'unpaid';
        } elseif ($amountPaid < ($amountDue + $fine - $discount)) {
            $status = 'partial';
        }

        $payment = FeePayment::create([
            'school_id'        => $schoolId,
            'student_id'       => $student->id,
            'fee_structure_id' => $feeStructure?->id,
            'receipt_no'       => $validated['reference_no'] ?? ('RCP-' . date('Y') . '-' . str_pad(FeePayment::withoutGlobalScopes()->where('school_id', $schoolId)->count() + 1, 5, '0', STR_PAD_LEFT)),
            'amount_due'       => $amountDue,
            'amount_paid'      => $amountPaid,
            'discount'         => $discount,
            'fine'             => $fine,
            'payment_date'     => $validated['payment_date'],
            'month_year'       => $validated['month_year'] ?? date('Y-m', strtotime($validated['payment_date'])),
            'method'           => $validated['method'],
            'status'           => $status,
            'note'             => $validated['note'] ?? 'Fee Payment Entry',
        ]);

        try {
            SendPaymentReceiptNotification::dispatch($payment);
        } catch (\Throwable) {}

        return redirect('/school/fees/payments')
            ->with('success', "Payment recorded successfully. Receipt #{$payment->receipt_no} generated.");
    }

    public function show(FeePayment $feePayment): Response
    {
        $schoolId = auth()->user()->school_id;
        abort_unless($feePayment->school_id === $schoolId, 404);

        $relations = ['student.schoolClass', 'student.section'];
        if (Schema::hasTable('fee_payment_allocations')) {
            $relations[] = 'allocations.voteHead';
            $relations[] = 'allocations.invoice';
        }

        $payment = $feePayment->load($relations);

        $school = School::find($schoolId);
        $currentBalance = StudentLedgerService::computeBalance($payment->student_id, $schoolId);

        return Inertia::render('SchoolAdmin/Fees/Receipt', [
            'payment'        => $payment,
            'school'         => $school,
            'currentBalance' => $currentBalance,
        ]);
    }
}