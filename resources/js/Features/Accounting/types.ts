// ─── Master COA Types ────────────────────────────────────────────────────────

export type AccountType =
    | 'asset'
    | 'liability'
    | 'equity'
    | 'revenue'
    | 'expense';
export type NormalBalance = 'debit' | 'credit';
export type FiscalModeContext = 'all' | 'ppn_only' | 'non_ppn_only';

export interface ChartOfAccount {
    id: number;
    parent_id: number | null;
    code: string;
    name: string;
    display_name: string;
    type: AccountType;
    type_label: string;
    normal_balance: NormalBalance;
    normal_balance_label: string;
    fiscal_mode_context: FiscalModeContext;
    fiscal_mode_context_label: string;
    level: number;
    is_active: boolean;
    is_leaf: boolean;
    children?: ChartOfAccount[];
}

export interface AccountingSetting {
    id: number;
    key: string;
    description: string | null;
    chart_of_account_id: number;
    chart_of_account: ChartOfAccount;
}

export interface EnumOption {
    value: string;
    label: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface CreateChartOfAccountForm {
    parent_id: number | null;
    code: string;
    name: string;
    type: AccountType | '';
    normal_balance: NormalBalance | '';
    fiscal_mode_context: FiscalModeContext;
}

export interface UpdateChartOfAccountForm {
    code: string;
    name: string;
    fiscal_mode_context: FiscalModeContext;
}
