import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import { ChartOfAccount } from '@/Features/Accounting/types';
import { useState } from 'react';

interface CoaTreeNodeProps {
    account: ChartOfAccount;
    onEdit: (account: ChartOfAccount) => void;
    onDeactivate: (account: ChartOfAccount) => void;
    onAddChild: (parent: ChartOfAccount) => void;
    level?: number;
}

const TYPE_BADGE: Record<string, string> = {
    asset: 'bg-blue-50 text-blue-700 border-blue-100',
    liability: 'bg-rose-50 text-rose-700 border-rose-100',
    equity: 'bg-violet-50 text-violet-700 border-violet-100',
    revenue: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    expense: 'bg-amber-50 text-amber-700 border-amber-100',
};

const TYPE_PREFIX: Record<string, string> = {
    asset: '1 - Aset',
    liability: '2 - Kewajiban',
    equity: '3 - Ekuitas',
    revenue: '4 - Pendapatan',
    expense: '5 - Beban',
};

const BALANCE_BADGE: Record<string, string> = {
    debit: 'bg-slate-100 text-slate-600 border-slate-200',
    credit: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function CoaTreeNode({
    account,
    onEdit,
    onDeactivate,
    onAddChild,
    level = 0,
}: CoaTreeNodeProps) {
    const [expanded, setExpanded] = useState(level < 2);
    const hasChildren = account.children && account.children.length > 0;

    const menuItems: ActionMenuItem[] = [
        ...(account.is_active
            ? [
                  {
                      label: 'Edit Akun',
                      icon: (
                          <svg
                              className="h-3.5 w-3.5 text-slate-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                          >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                              />
                          </svg>
                      ),
                      onClick: () => onEdit(account),
                  },
                  {
                      label: 'Nonaktifkan Akun',
                      icon: (
                          <svg
                              className="h-3.5 w-3.5 text-rose-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                          >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                              />
                          </svg>
                      ),
                      onClick: () => onDeactivate(account),
                      variant: 'danger' as const,
                  },
              ]
            : []),
    ];

    return (
        <div>
            <div
                className={`group flex items-center gap-2 px-4 py-3 transition-colors hover:bg-slate-50/60 ${!account.is_active ? 'opacity-50' : ''}`}
                style={{ paddingLeft: `${1 + level * 1.5}rem` }}
            >
                {/* Expand / Collapse toggle */}
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 ${!hasChildren ? 'invisible' : ''}`}
                >
                    <svg
                        className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m9 18 6-6-6-6"
                        />
                    </svg>
                </button>

                {/* Leaf indicator dot */}
                {!hasChildren && (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                )}

                {/* Code */}
                <span className="w-16 flex-shrink-0 font-mono text-xs font-bold text-slate-900">
                    {account.code}
                </span>

                {/* Name */}
                <span
                    className={`flex-1 text-xs font-bold text-slate-900 ${!account.is_leaf ? 'font-bold text-slate-800' : ''}`}
                >
                    {account.name}
                </span>

                {/* Badges */}
                <div className="hidden w-64 flex-shrink-0 items-center justify-end gap-2 pr-2 sm:flex">
                    <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold leading-none ${TYPE_BADGE[account.type] ?? ''}`}
                    >
                        {TYPE_PREFIX[account.type] ?? account.type_label}
                    </span>
                    <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold leading-none ${BALANCE_BADGE[account.normal_balance]}`}
                    >
                        {account.normal_balance_label}
                    </span>
                    {account.fiscal_mode_context !== 'all' && (
                        <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold leading-none text-indigo-700">
                            {account.fiscal_mode_context === 'ppn_only'
                                ? 'PPN'
                                : 'Non-PPN'}
                        </span>
                    )}
                    {!account.is_active && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold leading-none text-slate-500">
                            Nonaktif
                        </span>
                    )}
                </div>

                {/* Actions (Always visible 3-dots ActionDropdown) */}
                <div className="flex w-12 flex-shrink-0 items-center justify-center">
                    <ActionDropdown items={menuItems} />
                </div>
            </div>

            {/* Render children recursively */}
            {hasChildren && expanded && (
                <div className="ml-8 border-l border-slate-100">
                    {account.children!.map((child) => (
                        <CoaTreeNode
                            key={child.id}
                            account={child}
                            onEdit={onEdit}
                            onDeactivate={onDeactivate}
                            onAddChild={onAddChild}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
