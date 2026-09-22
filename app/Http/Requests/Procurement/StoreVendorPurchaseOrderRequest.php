<?php

declare(strict_types=1);

namespace App\Http\Requests\Procurement;

use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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

    /**
     * Konfigurasi validator tambahan untuk invariant Mode PPN.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $project = $this->route('project');
            $vendorId = $this->input('vendor_id');

            if ($project instanceof Project && $vendorId) {
                $isProjectPpn = $project->fiscal_mode instanceof FiscalMode
                    ? $project->fiscal_mode === FiscalMode::PPN
                    : $project->fiscal_mode === FiscalMode::PPN->value;

                if ($isProjectPpn) {
                    $vendor = Vendor::find($vendorId);
                    if ($vendor && ! $vendor->isPkp()) {
                        $validator->errors()->add(
                            'vendor_id',
                            "Vendor '{$vendor->name}' berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN. Silakan pilih vendor berstatus PKP atau alihkan transaksi ke proyek Mode Non-PPN."
                        );
                    }
                }
            }
        });
    }
}
