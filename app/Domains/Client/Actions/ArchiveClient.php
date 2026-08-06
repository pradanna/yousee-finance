<?php

namespace App\Domains\Client\Actions;

use App\Domains\Client\Models\Client;

class ArchiveClient
{
    /**
     * Archive or unarchive a client.
     *
     * @param \App\Domains\Client\Models\Client $client
     * @param bool $isArchived
     * @return \App\Domains\Client\Models\Client
     */
    public function execute(Client $client, bool $isArchived = true): Client
    {
        $client->update([
            'is_archived' => $isArchived,
        ]);

        return $client;
    }
}
