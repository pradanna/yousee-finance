export interface ProjectionSummary {
    current_cash_balance: number;
    projected_inflow_total: number;
    projected_outflow_po_total: number;
    projected_outflow_ppn_total: number;
    projected_outflow_total: number;
    projected_net_cashflow: number;
    projected_ending_cash_balance: number;
    crosses_month_end: boolean;
    month_end_date: string;
    ppn_month: number;
    ppn_year: number;
    ppn_keluaran_total: number;
    ppn_masukan_total: number;
    ppn_net_payable: number;
    ppn_is_settled: boolean;
}

export interface ProjectionTimelineItem {
    date: string;
    day_name: string;
    is_today: boolean;
    is_month_end: boolean;
    inflow: number;
    outflow_po: number;
    outflow_ppn: number;
    total_outflow: number;
    net: number;
    running_balance: number;
    inflow_count: number;
    outflow_count: number;
}

export interface InflowItem {
    id: string;
    invoice_id: string;
    invoice_number: string;
    client_id: string;
    client_name: string;
    project_id: string | null;
    project_code: string | null;
    project_name: string | null;
    label: string;
    due_date: string;
    total_term_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    is_overdue: boolean;
}

export interface OutflowItem {
    id: string;
    po_id: string | null;
    po_number: string;
    vendor_id: string | null;
    vendor_name: string;
    project_id: string | null;
    project_code: string | null;
    project_name: string | null;
    label: string;
    due_date: string;
    total_term_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    is_overdue: boolean;
    type: 'po' | 'ppn';
}

export interface FinancialProjectionData {
    fiscal_mode: string;
    filters: {
        days: number;
        start_date: string;
        end_date: string;
        fiscal_mode: string;
    };
    summary: ProjectionSummary;
    timeline: ProjectionTimelineItem[];
    inflow_items: InflowItem[];
    outflow_items: OutflowItem[];
}

export interface FinancialProjectionPageProps {
    projection: FinancialProjectionData;
}
