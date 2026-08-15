<?php

declare(strict_types=1);

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesOptionResource extends JsonResource
{
    /**
     * Dropdown option payload — always resolved via ->resolve() at the call
     * site into a plain array, but keep $wrap=null too so direct ::collection()
     * usage elsewhere doesn't accidentally get "data"-wrapped.
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
