<?php

declare(strict_types=1);

namespace App\Http\Requests\Project;

use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
}
