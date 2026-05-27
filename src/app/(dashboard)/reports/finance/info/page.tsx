'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Shield, Wallet, Info } from 'lucide-react'

// ─── Info item ────────────────────────────────────────────────────────────────

function InfoItem({
    icon: Icon,
    iconColor,
    iconBg,
    title,
    description,
}: {
    icon: React.ElementType
    iconColor: string
    iconBg: string
    title: string
    description: string
}) {
    return (
        <div className="flex gap-4 py-4 border-b border-border-subtle last:border-0">
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: iconBg }}
            >
                <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-[15px] font-bold text-primary">{title}</p>
                <p className="text-[13px] text-secondary leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceReportInfoPage() {
    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/reports/finance"
                    aria-label="Back to Finance Report"
                    className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-border-subtle shrink-0 touch-manipulation transition-opacity active:opacity-60"
                >
                    <ArrowLeft className="w-4.5 h-4.5 text-secondary" />
                </Link>
                <h1 className="text-lg font-bold text-primary">Report Info</h1>
            </div>

            {/* Intro card */}
            <div className="page-card flex gap-3">
                <Info className="w-5 h-5 text-blue shrink-0 mt-0.5" />
                <p className="text-[14px] text-secondary leading-relaxed">
                    The Finance Report gives you a complete picture of your financial activity on PayzDesk.
                    All figures are computed in real time from your transaction history and update whenever
                    you apply a date filter.
                </p>
            </div>

            {/* Metric explanations */}
            <div className="page-card p-0! overflow-hidden">
                <div className="px-4 py-3.5 border-b border-border-subtle">
                    <p className="section-label mb-0">WHAT EACH METRIC MEANS</p>
                </div>
                <div className="px-4">
                    <InfoItem
                        icon={ArrowDownToLine}
                        iconColor="var(--accent-green)"
                        iconBg="var(--accent-green-dim)"
                        title="Total Deposits"
                        description="Sum of all deposit transactions (pending + completed + failed) in the selected period. Completed deposits are the ones that have been credited to your account."
                    />
                    <InfoItem
                        icon={ArrowUpFromLine}
                        iconColor="var(--accent-amber)"
                        iconBg="var(--accent-amber-dim)"
                        title="Total Withdrawals"
                        description="Sum of all withdrawal transactions requested. Only completed withdrawals have actually left your account. Pending withdrawals are held until processed."
                    />
                    <InfoItem
                        icon={Shield}
                        iconColor="var(--accent-blue)"
                        iconBg="var(--accent-blue-dim)"
                        title="Security Deposits"
                        description="Funds you have deposited as security margin. These are separate from your operational deposits and are held as collateral."
                    />
                    <InfoItem
                        icon={Shield}
                        iconColor="var(--accent-red)"
                        iconBg="var(--accent-red-dim)"
                        title="Security Withdrawals"
                        description="Security margin funds you have withdrawn back. The Security Net figure shows your current net security balance."
                    />
                    <InfoItem
                        icon={Wallet}
                        iconColor="var(--accent-gold)"
                        iconBg="var(--accent-gold-dim)"
                        title="Net Balance"
                        description="Completed deposits minus completed withdrawals. This is your effective operational balance for the selected period. It does not include pending transactions."
                    />
                </div>
            </div>

            {/* Date filter note */}
            <div className="page-card flex flex-col gap-2">
                <p className="section-label mb-0">ABOUT DATE FILTERS</p>
                <p className="text-[13px] text-secondary leading-relaxed">
                    When no date filter is applied, the report shows your all-time totals. Use the FROM and TO
                    date pickers on the Finance Report page to narrow the view to any period — useful for
                    monthly or weekly reconciliation.
                </p>
                <p className="text-[13px] text-secondary leading-relaxed">
                    Dates are inclusive: selecting 01/05/2026 to 31/05/2026 includes all transactions
                    from midnight on the 1st to 11:59 PM on the 31st.
                </p>
            </div>

        </div>
    )
}