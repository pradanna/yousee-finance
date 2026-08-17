import { Project } from './projectTypes';

// Deprecated mock arrays kept empty to ensure no static data leaks into production
export const mockVendors: Array<{ id: string; name: string }> = [];
export const mockClients: Array<{ id: string; name: string }> = [];
export const mockSalesPICs: string[] = [];
export const initialProjectsPPN: Project[] = [];
export const initialProjectsNonPPN: Project[] = [];
