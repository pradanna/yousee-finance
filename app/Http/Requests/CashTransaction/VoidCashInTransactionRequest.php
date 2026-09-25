<?php

declare(strict_types=1);

namespace App\Http\Requests\CashTransaction;

use Illuminate\Foundation\Http\FormRequest;

class VoidCashInTransactionRequest extends FormRequest
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
            'void_reason' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'void_reason.required' => 'Alasan pembatalan transaksi wajib diisi.',
            'void_reason.max'      => 'Alasan pembatalan maksimal 500 karakter.',
        ];
    }
}
