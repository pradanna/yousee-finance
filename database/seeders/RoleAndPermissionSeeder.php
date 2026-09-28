<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Delete obsolete roles if present
        Role::whereIn('name', ['akuntan', 'staff'])->delete();

        // Create basic roles (idempotent)
        $rolePimpinan = Role::firstOrCreate(['name' => 'pimpinan', 'guard_name' => 'web']);
        $roleAdmin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // Create default permissions (idempotent)
        $permissions = [
            'unlock-closing-period',
            'manage-users',
            'approve-po',
            'create-invoice',
        ];

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        // Assign permissions to roles
        $rolePimpinan->syncPermissions(Permission::whereIn('name', ['unlock-closing-period', 'approve-po', 'manage-users', 'create-invoice'])->get());
        $roleAdmin->syncPermissions(Permission::whereIn('name', ['manage-users', 'create-invoice'])->get());
    }
}
