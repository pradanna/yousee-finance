export interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    roles: string[];
    status: 'active' | 'inactive' | 'suspended';
    last_login_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface UserFormData {
    name: string;
    email: string;
    role: string;
    status: string;
    password?: string;
    password_confirmation?: string;
}

export interface UserPaginationData {
    data: UserData[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
}

export interface UserMetrics {
    totalUsers: number;
    pimpinanCount: number;
    akuntanCount: number;
    staffCount: number;
    adminCount: number;
    activeUsers: number;
    inactiveUsers: number;
}

export interface UserFilters {
    search: string;
    role: string;
    status: string;
}
