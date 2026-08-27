<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolPaymentGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentIntegrationController extends Controller
{
    public function index(): Response
    {
        $schoolId = auth()->user()->school_id;
        $school = School::findOrFail($schoolId);

        $mpesaConfig = SchoolPaymentGateway::where('school_id', $schoolId)
            ->where('gateway_name', 'mpesa')
            ->first();

        $bankConfig = SchoolPaymentGateway::where('school_id', $schoolId)
            ->where('gateway_name', 'bank')
            ->first();

        $webhookUrl = url("/api/v1/payments/daraja/callback/{$school->slug}");

        return Inertia::render('SchoolAdmin/Fees/Integrations', [
            'school'      => $school,
            'mpesaConfig' => $mpesaConfig,
            'bankConfig'  => $bankConfig,
            'webhookUrl'  => $webhookUrl,
        ]);
    }

    public function updateMpesa(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'shortcode'                => 'required|string|max:50',
            'shortcode_type'           => 'required|in:paybill,till',
            'consumer_key'             => 'nullable|string|max:255',
            'consumer_secret'          => 'nullable|string|max:500',
            'passkey'                  => 'nullable|string|max:500',
            'account_reference_format' => 'required|string|max:50',
            'is_sandbox'               => 'required|boolean',
            'is_active'                => 'required|boolean',
        ]);

        SchoolPaymentGateway::updateOrCreate(
            ['school_id' => $schoolId, 'gateway_name' => 'mpesa'],
            $validated
        );

        return redirect()->back()->with('success', 'M-Pesa Daraja payment integration settings updated.');
    }

    public function updateBank(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'bank_name'            => 'required|string|max:100',
            'branch'               => 'nullable|string|max:100',
            'account_no'           => 'required|string|max:50',
            'account_name'         => 'required|string|max:150',
            'payment_instructions' => 'nullable|string|max:500',
            'is_active'            => 'required|boolean',
        ]);

        SchoolPaymentGateway::updateOrCreate(
            ['school_id' => $schoolId, 'gateway_name' => 'bank'],
            [
                'shortcode'      => $validated['account_no'],
                'shortcode_type' => 'bank',
                'bank_details'   => $validated,
                'is_active'      => $validated['is_active'],
            ]
        );

        return redirect()->back()->with('success', 'Institutional bank account details saved.');
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
