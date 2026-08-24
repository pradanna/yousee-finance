<?php

declare(strict_types=1);

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaxSettlementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'month'              => ['required', 'integer', 'min:1', 'max:12'],
            'year'               => ['required', 'integer', 'min:2000', 'max:2099'],
            'fiscal_mode'        => ['nullable', 'string', 'in:ppn,non-ppn'],
            'ntpn'               => ['required', 'string', 'min:8', 'max:16'],
            'paid_date'          => ['required', 'date'],
            'bank_name'          => ['required', 'string', 'max:255'],
            'ppn_keluaran_total' => ['required', 'numeric', 'min:0'],
            'ppn_masukan_total'  => ['required', 'numeric', 'min:0'],
            'net_amount'         => ['required', 'numeric'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ];
    }
}
