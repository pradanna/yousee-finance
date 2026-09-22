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

class ProjectLocationImportRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.vendor_id' => ['required', 'uuid', 'exists:vendors,id'],
            'items.*.area' => ['required', 'string', 'max:255'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.type' => ['required', Rule::enum(LocationType::class)],
            'items.*.size' => ['required', 'string', 'max:50'],
            'items.*.orientation' => ['nullable', Rule::enum(LocationOrientation::class)],
            'items.*.lighting' => ['nullable', Rule::enum(LocationLighting::class)],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.vendor_cost' => ['required', 'numeric', 'min:0'],
            'items.*.is_ppn_inclusive' => ['nullable', 'boolean'],
            'items.*.top_notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Invariant: Pada proyek Mode PPN, seluruh vendor pada data impor harus berstatus PKP.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $project = $this->route('project');
            if (! ($project instanceof Project)) {
                return;
            }

            $isProjectPpn = $project->fiscal_mode instanceof FiscalMode
                ? $project->fiscal_mode === FiscalMode::PPN
                : $project->fiscal_mode === FiscalMode::PPN->value;

            if (! $isProjectPpn) {
                return;
            }

            $items = $this->input('items', []);
            if (! is_array($items)) {
                return;
            }

            $vendorIds = array_unique(array_filter(array_column($items, 'vendor_id')));
            if (empty($vendorIds)) {
                return;
            }

            $nonPkpVendors = Vendor::whereIn('id', $vendorIds)->get()->filter(fn (Vendor $v) => ! $v->isPkp());

            if ($nonPkpVendors->isNotEmpty()) {
                $names = $nonPkpVendors->pluck('name')->implode(', ');
                $validator->errors()->add(
                    'items',
                    "Terdapat vendor berstatus Non-PKP ({$names}) yang dilarang digunakan pada proyek Mode PPN. Silakan perbaiki file import atau lengkapi NPWP vendor di Master Vendor."
                );
            }
        });
    }
}
