<?php

declare(strict_types=1);

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientOptionResource extends JsonResource
{
    /**
     * Dropdown option payload stays a plain array (no "data" wrapper) —
     * ProjectController::index() feeds this straight into Projects.tsx as
     * `clients: ClientOption[]`.
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
