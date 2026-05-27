'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Shield,
    ShieldOff,
    Wallet,
    Clock,
    CheckCircle2,
    Info,
} from 'lucide-react'
import { apiClient } from '@/lib/axios'
import { formatINR } from '@/utils'
import type { FinanceReportSummary } from '@/types'

// ─── Date filter bar ──────────────────────────────────────────────────────────

interface DateRange { from: string; to: string }

function DateFilter({
    value,
    onChange,
    onClear,
}: {
    value: DateRange
    onChange: (v: DateRange) => void
    onClear: () => void
}) {
    const hasFilter = value.from !== '' || value.to !== ''

    return (
        <div className="filter-card flex flex-col gap-3">
            <p className="section-label mb-0">FILTER BY DATE</p>
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <p className="section-label mb-0">FROM</p>
                    <input
                        type="date"
                        value={value.from}
                        max={value.to || undefined}
                        onChange={(e) => onChange({ ...value, from: e.target.value })}
                        className="form-input py-2.5 text-sm"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="section-label mb-0">TO</p>
                    <input
                        type="date"
                        value={value.to}
                        min={value.from || undefined}
                        onChange={(e) => onChange({ ...value, to: e.target.value })}
                        className="form-input py-2.5 text-sm"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
            </div>
            {hasFilter && (
                <button
                    onClick={onClear}
                    className="w-full rounded-full py-2.5 text-[13px] font-bold text-danger border border-[rgba(239,68,68,0.25)] bg-danger-dim touch-manipulation"
                >
                    ↺ CLEAR FILTER
                </button>
            )}
        </div>
    )
}

// ─── Stat row ────────────────────────────────────────────────────────────────

function StatRow({
    icon: Icon,
    label,
    value,
    iconColor,
    iconBg,
    valueColor,
}: {
    icon: React.ElementType
    label: string
    value: string
    iconColor: string
    iconBg: string
    valueColor?: string
}) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-0">
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: iconBg }}
            >
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
            <span className="flex-1 text-[14px] text-secondary">{label}</span>
            <span
                className="text-[15px] font-bold"
                style={{ color: valueColor ?? 'var(--text-primary)' }}
            >
                {value}
            </span>
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="skeleton page-card h-28" />
            <div className="skeleton page-card h-64" />
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMPTY_DATE: DateRange = { from: '', to: '' }

export default function FinanceReportPage() {
    const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE)

    const { data, isLoading, isError } = useQuery<FinanceReportSummary>({
        queryKey: ['reports', 'finance', dateRange],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (dateRange.from) params.set('dateFrom', dateRange.from)
            if (dateRange.to) params.set('dateTo', dateRange.to)
            const res = await apiClient.get(`/reports/finance?${params}`)
            return res.data.data as FinanceReportSummary
        },
    })

    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-primary">Finance Report</h1>
                <Link
                    href="/reports/finance/info"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] border border-border-subtle touch-manipulation"
                    aria-label="Report info"
                >
                    <Info className="w-4 h-4 text-secondary" />
                </Link>
            </div>

            {/* Date filter */}
            <DateFilter
                value={dateRange}
                onChange={setDateRange}
                onClear={() => setDateRange(EMPTY_DATE)}
            />

            {isLoading && <Skeleton />}

            {isError && (
                <div className="error-banner">
                    Failed to load finance report. Please try again.
                </div>
            )}

            {data && (
                <>
                    {/* Net balance summary card */}
                    <div className="page-card flex flex-col gap-1">
                        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">
                            Net Balance (Completed)
                        </p>
                        <p
                            className="text-[32px] font-extrabold"
                            style={{
                                color: data.netBalance >= 0
                                    ? 'var(--accent-green-light)'
                                    : 'var(--accent-red-light)',
                            }}
                        >
                            {formatINR(data.netBalance)}
                        </p>
                        <p className="text-[12px] text-muted">
                            Based on completed deposits minus completed withdrawals
                            {(data.dateFrom || data.dateTo) && ' for selected period'}
                        </p>
                    </div>

                    {/* Deposits card */}
                    <div className="page-card p-0! overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border-subtle">
                            <p className="section-label mb-0">DEPOSITS</p>
                        </div>
                        <div className="px-4">
                            <StatRow
                                icon={ArrowDownToLine}
                                label="Total Deposits"
                                value={formatINR(data.totalDeposits)}
                                iconColor="var(--accent-green)"
                                iconBg="var(--accent-green-dim)"
                                valueColor="var(--accent-green-light)"
                            />
                            <StatRow
                                icon={CheckCircle2}
                                label="Completed"
                                value={formatINR(data.completedDeposits)}
                                iconColor="var(--accent-green)"
                                iconBg="var(--accent-green-dim)"
                            />
                            <StatRow
                                icon={Clock}
                                label="Pending"
                                value={formatINR(data.pendingDeposits)}
                                iconColor="var(--accent-amber)"
                                iconBg="var(--accent-amber-dim)"
                            />
                        </div>
                    </div>

                    {/* Withdrawals card */}
                    <div className="page-card p-0! overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border-subtle">
                            <p className="section-label mb-0">WITHDRAWALS</p>
                        </div>
                        <div className="px-4">
                            <StatRow
                                icon={ArrowUpFromLine}
                                label="Total Withdrawals"
                                value={formatINR(data.totalWithdrawals)}
                                iconColor="var(--accent-amber)"
                                iconBg="var(--accent-amber-dim)"
                                valueColor="var(--accent-amber)"
                            />
                            <StatRow
                                icon={CheckCircle2}
                                label="Completed"
                                value={formatINR(data.completedWithdrawals)}
                                iconColor="var(--accent-green)"
                                iconBg="var(--accent-green-dim)"
                            />
                            <StatRow
                                icon={Clock}
                                label="Pending"
                                value={formatINR(data.pendingWithdrawals)}
                                iconColor="var(--accent-amber)"
                                iconBg="var(--accent-amber-dim)"
                            />
                        </div>
                    </div>

                    {/* Security card */}
                    <div className="page-card p-0! overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border-subtle">
                            <p className="section-label mb-0">SECURITY</p>
                        </div>
                        <div className="px-4">
                            <StatRow
                                icon={Shield}
                                label="Security Deposits"
                                value={formatINR(data.totalSecurityDeposits)}
                                iconColor="var(--accent-blue)"
                                iconBg="var(--accent-blue-dim)"
                            />
                            <StatRow
                                icon={ShieldOff}
                                label="Security Withdrawals"
                                value={formatINR(data.totalSecurityWithdrawals)}
                                iconColor="var(--accent-red)"
                                iconBg="var(--accent-red-dim)"
                            />
                        </div>
                    </div>

                    {/* Wallet summary */}
                    <div className="page-card flex items-center gap-4">
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'var(--accent-gold-dim)' }}
                        >
                            <Wallet className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[12px] text-muted">Security Net</p>
                            <p className="text-[16px] font-bold text-primary">
                                {formatINR(data.totalSecurityDeposits - data.totalSecurityWithdrawals)}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
