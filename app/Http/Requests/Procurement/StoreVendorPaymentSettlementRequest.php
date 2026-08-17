<?php

declare(strict_types=1);

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorPaymentSettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'paid_at'        => ['required', 'date'],
            'payment_method' => ['required', 'string', 'max:100'],
            'account_id'     => ['nullable', 'exists:chart_of_accounts,id'],
            'payment_ref'    => ['nullable', 'string', 'max:255'],
            'notes'          => ['nullable', 'string'],
        ];
    }
}
