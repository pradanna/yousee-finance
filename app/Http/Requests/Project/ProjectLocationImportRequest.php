<?php

declare(strict_types=1);

namespace App\Http\Requests\Project;

use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
}
