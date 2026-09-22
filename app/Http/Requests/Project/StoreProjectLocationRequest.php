<?php

declare(strict_types=1);

namespace App\Http\Requests\Project;

use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreProjectLocationRequest extends FormRequest
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
            'vendor_id' => ['required', 'uuid', 'exists:vendors,id'],
            'area' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(LocationType::class)],
            'size' => ['required', 'string', 'max:50'],
            'orientation' => ['nullable', Rule::enum(LocationOrientation::class)],
            'lighting' => ['nullable', Rule::enum(LocationLighting::class)],
            'qty' => ['nullable', 'integer', 'min:1'],
            'vendor_cost' => ['required', 'numeric', 'min:0'],
            'is_ppn_inclusive' => ['nullable', 'boolean'],
            'top_notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Invariant: Pada proyek Mode PPN, vendor Non-PKP dilarang ditambahkan.
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
