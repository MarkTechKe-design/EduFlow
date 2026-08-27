<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Services\PaymentGateways\DarajaMpesaAdapter;
use App\Services\PaymentProcessingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DarajaWebhookController extends Controller
{
    /**
     * Handle Safaricom Daraja C2B / STK Push callbacks.
     */
    public function handleCallback(Request $request, string $schoolSlug): JsonResponse
    {
        $school = School::where('slug', $schoolSlug)->first();
        if (!$school) {
            return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Invalid institution identifier.'], 404);
        }

        $adapter = new DarajaMpesaAdapter();
        $normalized = $adapter->parseWebhook($request);

        if (!$normalized) {
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Ignored unprocessable payload.'], 200);
        }

        $result = PaymentProcessingService::processIncomingPayment($school->id, $normalized);

        Log::info("M-Pesa Webhook Ingested for [{$school->slug}]", [
            'ref'    => $normalized['reference_code'],
            'amount' => $normalized['amount'],
            'status' => $result['status'],
        ]);

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Callback received and processed successfully.',
        ], 200);
    }
}