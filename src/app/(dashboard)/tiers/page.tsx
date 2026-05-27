'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Lock, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/axios'
import { formatINR } from '@/utils'
import type { ITier, TiersResponse } from '@/types'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="skeleton page-card h-36" />
            <div className="skeleton page-card h-48" />
            <div className="skeleton page-card h-48" />
        </div>
    )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percent, color }: { percent: number; color: string }) {
    return (
        <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%`, background: color }}
            />
        </div>
    )
}

// ─── Current tier card ────────────────────────────────────────────────────────

function CurrentTierCard({ data }: { data: TiersResponse }) {
    const { currentTier, nextTier, progressPercent, totalCompletedDeposits } = data

    return (
        <div className="page-card flex flex-col gap-4">
            {/* Badge row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="text-[22px] font-extrabold"
                        style={{ color: currentTier.color }}
                    >
                        {currentTier.name}
                    </span>
                    <span className="text-[12px] font-semibold text-muted">TIER</span>
                </div>
                <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{
                        background: `${currentTier.color}22`,
                        color: currentTier.color,
                        border: `1px solid ${currentTier.color}44`,
                    }}
                >
                    CURRENT
                </span>
            </div>

            {/* Total deposits */}
            <div>
                <p className="text-[12px] text-muted">Total Completed Deposits</p>
                <p className="text-[20px] font-bold text-primary mt-0.5">
                    {formatINR(totalCompletedDeposits)}
                </p>
            </div>

            {/* Progress to next tier */}
            {nextTier ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[12px]">
                        <span className="text-secondary">Progress to {nextTier.name}</span>
                        <span className="font-bold text-primary">{progressPercent}%</span>
                    </div>
                    <ProgressBar percent={progressPercent} color={nextTier.color} />
                    <p className="text-[11px] text-muted">
                        {formatINR(nextTier.minDeposit - totalCompletedDeposits)} more needed to reach{' '}
                        <span style={{ color: nextTier.color }} className="font-semibold">
                            {nextTier.name}
                        </span>
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    <p className="text-[13px] font-semibold text-gold">You are at the highest tier!</p>
                </div>
            )}
        </div>
    )
}

// ─── Tier benefit card ────────────────────────────────────────────────────────

function TierCard({
    tier,
    isActive,
    isLocked,
}: {
    tier: ITier
    isActive: boolean
    isLocked: boolean
}) {
    return (
        <div
            className="page-card flex flex-col gap-4"
            style={{
                borderColor: isActive ? `${tier.color}55` : undefined,
                opacity: isLocked ? 0.55 : 1,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isLocked
                        ? <Lock className="w-4 h-4" style={{ color: tier.color }} />
                        : <CheckCircle2 className="w-4 h-4" style={{ color: tier.color }} />
                    }
                    <span
                        className="text-[18px] font-extrabold"
                        style={{ color: tier.color }}
                    >
                        {tier.name}
                    </span>
                </div>
                {isActive && (
                    <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{
                            background: `${tier.color}22`,
                            color: tier.color,
                        }}
                    >
                        ACTIVE
                    </span>
                )}
            </div>

            {/* Min deposit requirement */}
            <div
                className="rounded-[10px] px-4 py-2.5 flex items-center justify-between"
                style={{ background: 'rgba(0,0,0,0.2)' }}
            >
                <span className="text-[12px] text-secondary">Minimum Deposits</span>
                <span className="text-[14px] font-bold text-primary">
                    {tier.minDeposit === 0 ? 'No minimum' : formatINR(tier.minDeposit)}
                </span>
            </div>

            {/* Benefits list */}
            <div className="flex flex-col gap-2">
                {tier.benefits.map((b) => (
                    <div key={b.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted" />
                            <span className="text-[13px] text-secondary">{b.label}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-primary">{b.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Static tiers list (for rendering all tiers, not just current) ────────────
// We use the `allTiers` array returned by the API response.

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TiersPage() {
    const { data, isLoading, isError } = useQuery<TiersResponse>({
        queryKey: ['tiers'],
        queryFn: async () => {
            const res = await apiClient.get('/tiers')
            return res.data.data as TiersResponse
        },
    })

    // Build an ordered list of all tiers for display.
    const allTiers: ITier[] = data?.allTiers ?? []

    return (
        <div className="flex flex-col gap-4 animate-[fadeIn_200ms_ease-out]">

            {/* Header */}
            <div>
                <h1 className="text-lg font-bold text-primary">Tier Benefits</h1>
                <p className="text-[13px] text-secondary mt-1">
                    Higher tiers unlock better withdrawal limits and commission rates.
                </p>
            </div>

            {isLoading && <Skeleton />}

            {isError && (
                <div className="error-banner">
                    Failed to load tier information. Please try again.
                </div>
            )}

            {data && (
                <>
                    {/* Current tier summary */}
                    <CurrentTierCard data={data} />

                    {/* Section label */}
                    <p className="section-label mt-1">ALL TIERS</p>

                    {/* All tier cards */}
                    {allTiers.map((tier) => {
                        const isActive = tier.id === data.currentTier.id
                        const isLocked = tier.minDeposit > data.totalCompletedDeposits
                        return (
                            <TierCard
                                key={tier.id}
                                tier={tier}
                                isActive={isActive}
                                isLocked={isLocked}
                            />
                        )
                    })}

                    {/* Note */}
                    <p className="text-[12px] text-muted text-center pb-2">
                        Tier status updates automatically as your completed deposits grow.
                    </p>
                </>
            )}
        </div>
    )
}
