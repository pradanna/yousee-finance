<?php

namespace App\Domains\Client\Actions;

use App\Domains\Client\Models\Client;

class CreateClient
{
    /**
     * Create a new client.
     *
     * @param array $data
     * @return \App\Domains\Client\Models\Client
     */
    public function execute(array $data): Client
    {
        return Client::create($data);
    }
}
