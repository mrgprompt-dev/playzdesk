'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { FilterBar, FilterState } from '@/components/shared/FilterBar'
import { apiClient } from '@/lib/axios'
import { formatINR, formatDateTime } from '@/utils'
import type { AdjustmentsResponse, IAdjustment } from '@/types'

// ─── Status options (type filter) ────────────────────────────────────────────

const TYPE_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'credit', label: 'Credit' },
    { value: 'debit', label: 'Debit' },
]

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchAdjustments(filter: FilterState): Promise<AdjustmentsResponse> {
    const params = new URLSearchParams()
    if (filter.status) params.set('type', filter.status)
    if (filter.search) params.set('search', filter.search)
    if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
    if (filter.dateTo) params.set('dateTo', filter.dateTo)
    const res = await apiClient.get(`/reports/adjustments?${params}`)
    return res.data.data as AdjustmentsResponse
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
    return (
        <div className="flex items-center gap-3 py-3.5 border-b border-border-subtle">
            <div className="skeleton w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
                <div className="skeleton h-3.5 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton h-4 w-16 rounded" />
        </div>
    )
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ data }: { data: AdjustmentsResponse }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {/* Credit */}
            <div className="page-card flex flex-col gap-1 items-center text-center p-3">
                <TrendingUp className="w-4 h-4 text-green-light" />
                <p className="text-[10px] text-muted uppercase tracking-wide font-semibold">Credit</p>
                <p className="text-[13px] font-bold text-green-light">{formatINR(data.totalCredit)}</p>
            </div>
            {/* Debit */}
            <div className="page-card flex flex-col gap-1 items-center text-center p-3">
                <TrendingDown className="w-4 h-4 text-danger-light" />
                <p className="text-[10px] text-muted uppercase tracking-wide font-semibold">Debit</p>
                <p className="text-[13px] font-bold text-danger-light">{formatINR(data.totalDebit)}</p>
            </div>
            {/* Net */}
            <div className="page-card flex flex-col gap-1 items-center text-center p-3">
                <Minus className="w-4 h-4 text-gold" />
                <p className="text-[10px] text-muted uppercase tracking-wide font-semibold">Net</p>
                <p
                    className="text-[13px] font-bold"
                    style={{ color: data.net >= 0 ? 'var(--accent-green-light)' : 'var(--accent-red-light)' }}
                >
                    {formatINR(data.net)}
                </p>
            </div>
        </div>
    )
}

// ─── Adjustment row ───────────────────────────────────────────────────────────

function AdjustmentRow({ record }: { record: IAdjustment }) {
    const isCredit = record.type === 'credit'

    return (
        <div className="flex items-center gap-3 py-3.5 border-b border-border-subtle last:border-0">
            {/* Icon */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                    background: isCredit ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                }}
            >
                {isCredit
                    ? <TrendingUp className="w-4 h-4 text-green-light" />
                    : <TrendingDown className="w-4 h-4 text-danger-light" />
                }
            </div>

            {/* Description + date */}
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-primary truncate">{record.description}</p>
                {record.referenceId && (
                    <p className="text-[12px] text-muted truncate">Ref: {record.referenceId}</p>
                )}
                <p className="text-[11px] text-muted mt-0.5">{formatDateTime(record.createdAt)}</p>
            </div>

            {/* Amount */}
            <span
                className="text-[15px] font-bold shrink-0"
                style={{ color: isCredit ? 'var(--accent-green-light)' : 'var(--accent-red-light)' }}
            >
                {isCredit ? '+' : '-'}{formatINR(record.amount)}
            </span>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMPTY_FILTER: FilterState = { status: '', search: '', dateFrom: '', dateTo: '' }

export default function AdjustmentsPage() {
    const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER)

    const { data, isLoading, isError } = useQuery<AdjustmentsResponse>({
        queryKey: ['reports', 'adjustments', filter],
        queryFn: () => fetchAdjustments(filter),
        staleTime: 20_000,
    })

    const hasActiveFilter = filter.status !== '' || filter.search !== '' || filter.dateFrom !== '' || filter.dateTo !== ''

    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">

            {/* Header */}
            <h1 className="text-lg font-bold text-primary">Adjustments</h1>

            {/* Filter — reuse FilterBar, status slot = type filter */}
            <FilterBar
                value={filter}
                onChange={setFilter}
                statusOptions={TYPE_OPTIONS}
                searchPlaceholder="Search description…"
            />

            {/* Summary strip — only when data loaded */}
            {data && <SummaryStrip data={data} />}

            {/* Results card */}
            <div className="page-card p-0! overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
                    <p className="section-label mb-0">ADJUSTMENT TRANSACTIONS</p>
                    {!isLoading && !isError && data && (
                        <p className="text-[12px] text-muted">
                            {data.records.length} {data.records.length === 1 ? 'record' : 'records'}
                        </p>
                    )}
                </div>

                <div className="px-4">
                    {isLoading && <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>}

                    {isError && (
                        <p className="text-sm text-muted text-center py-8">
                            Failed to load. Please refresh.
                        </p>
                    )}

                    {!isLoading && !isError && data?.records.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-[15px] font-bold text-primary">No Data Exists.</p>
                            <p className="text-[13px] text-muted mt-1">
                                {hasActiveFilter
                                    ? 'Please change the date range.'
                                    : 'No adjustment transactions yet.'}
                            </p>
                        </div>
                    )}

                    {!isLoading && !isError && data && data.records.length > 0 &&
                        data.records.map((record) => (
                            <AdjustmentRow key={record._id} record={record} />
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
