<?php

declare(strict_types=1);

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorPurchaseOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'vendor_id'        => ['required', 'uuid', 'exists:vendors,id'],
            'location_ids'     => ['required', 'array', 'min:1'],
            'location_ids.*'   => ['uuid', 'exists:project_locations,id'],
            'transaction_date' => ['required', 'date'],
            'lighting'         => ['nullable', 'string', 'in:Berlampu,Tidak Berlampu'],
            'top_notes'        => ['nullable', 'string', 'max:255'],

            // Skema termin pembayaran vendor (opsional — jika tidak dikirim,
            // payment plan tidak akan di-generate saat penerbitan PO).
            'term_scheme'       => ['nullable', 'string', 'in:full,dp,termin,installment'],
            'term_percents'     => ['nullable', 'array'],
            'term_percents.*'   => ['numeric', 'min:0.01', 'max:100'],
            'term_due_dates'    => ['nullable', 'array'],
            'term_due_dates.*'  => ['date'],
        ];
    }
}
