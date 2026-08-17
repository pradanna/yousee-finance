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
            'vendor_id' => ['required', 'uuid', 'exists:vendors,id'],
            'location_ids' => ['required', 'array', 'min:1'],
            'location_ids.*' => ['uuid', 'exists:project_locations,id'],
            'transaction_date' => ['required', 'date'],
        ];
    }
}
