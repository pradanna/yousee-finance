<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateVendorRequest extends FormRequest
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
        $vendor = $this->route('vendor');
        $vendorId = $vendor instanceof \App\Domains\Vendor\Models\Vendor ? $vendor->id : $vendor;

        return [
            'code' => ['nullable', 'string', 'max:50', Rule::unique('vendors', 'code')->ignore($vendorId)],
            'name' => ['required', 'string', 'max:255'],
            'pic' => ['nullable', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'is_pkp' => ['nullable', 'boolean'],
            'pkp' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Validasi: NPWP wajib diisi jika vendor berstatus PKP.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $isPkp = filter_var($this->input('is_pkp', false), FILTER_VALIDATE_BOOLEAN)
                || filter_var($this->input('pkp', false), FILTER_VALIDATE_BOOLEAN);

            $npwp = trim((string) $this->input('npwp', ''));

            if ($isPkp && $npwp === '') {
                $validator->errors()->add('npwp', 'NPWP wajib diisi jika vendor berstatus PKP.');
            }
        });
    }
}
