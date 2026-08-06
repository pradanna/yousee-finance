<?php

namespace App\Domains\Client\Actions;

use App\Domains\Client\Models\Client;

class UpdateClient
{
    /**
     * Update an existing client.
     *
     * @param \App\Domains\Client\Models\Client $client
     * @param array $data
     * @return \App\Domains\Client\Models\Client
     */
    public function execute(Client $client, array $data): Client
    {
        $client->update($data);

        return $client->fresh();
    }
}
