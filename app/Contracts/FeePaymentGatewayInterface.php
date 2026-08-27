<?php

namespace App\Contracts;

use Illuminate\Http\Request;

interface FeePaymentGatewayInterface
{
    public function getIdentifier(): string;

    public function parseWebhook(Request $request): ?array;
}