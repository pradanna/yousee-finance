<?php

declare(strict_types=1);

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
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
     * fiscal_mode is intentionally NOT accepted here — it is immutable
     * after create (guarded by Project::boot()).
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'client_id' => ['sometimes', 'required', 'uuid', 'exists:clients,id'],
            'sales_id' => ['nullable', 'uuid', 'exists:sales,id'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'contract_value' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_ppn_inclusive' => ['nullable', 'boolean'],
            'target_qty' => ['sometimes', 'required', 'integer', 'min:1'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,active,completed,cancelled'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
