<?php

namespace App\Domains\Client\Actions;

use App\Domains\Client\Models\Client;

class DeleteClient
{
    /**
     * Delete a client.
     *
     * @param \App\Domains\Client\Models\Client $client
     * @return bool|null
     */
    public function execute(Client $client): ?bool
    {
        return $client->delete();
    }
}
