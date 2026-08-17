export interface User {
    id: string | number;
    name: string;
    email: string;
    status?: string;
    roles?: string[];
    permissions?: string[];
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
};
