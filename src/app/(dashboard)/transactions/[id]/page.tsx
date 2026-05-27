'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  Hash,
  Calendar,
  Clock,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Timer,
  FileText,
  Shield,
} from 'lucide-react'
import { apiClient } from '@/lib/axios'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatINR, formatDateTime, formatDate } from '@/utils'
import type { ITransaction, IBankAccount } from '@/types'
import { useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopulatedTransaction extends Omit<ITransaction, 'bankId'> {
  bankId?: Pick<IBankAccount, '_id' | 'bankName' | 'accountNumber' | 'ifscCode' | 'branch'> | null
  referenceId?: string
  notes?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--status-completed-text)' }} />
    case 'failed':
      return <XCircle className="w-5 h-5" style={{ color: 'var(--status-failed-text)' }} />
    case 'disputed':
      return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-disputed-text)' }} />
    default:
      return <Timer className="w-5 h-5" style={{ color: 'var(--status-pending-text)' }} />
  }
}

function getTypeConfig(type: string) {
  if (type === 'deposit') {
    return {
      label: 'Deposit',
      icon: ArrowDownToLine,
      colorClass: 'text-blue',
      bgClass: 'bg-blue-dim',
      borderStyle: 'border-[rgba(59,130,246,0.15)]',
    }
  }
  if (type === 'security_deposit') {
    return {
      label: 'Security Deposit',
      icon: Shield,
      colorClass: 'text-green',
      bgClass: 'bg-green-dim',
      borderStyle: 'border-[rgba(22,163,74,0.15)]',
    }
  }
  if (type === 'security_withdrawal') {
    return {
      label: 'Security Withdrawal',
      icon: Shield,
      colorClass: 'text-amber',
      bgClass: 'bg-amber-dim',
      borderStyle: 'border-[rgba(245,158,11,0.15)]',
    }
  }
  return {
    label: 'Withdrawal',
    icon: ArrowUpFromLine,
    colorClass: 'text-green',
    bgClass: 'bg-green-dim',
    borderStyle: 'border-[rgba(22,163,74,0.15)]',
  }
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback: ignore */
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.06)] active:scale-95"
      aria-label="Copy"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted" />
      )}
    </button>
  )
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  copyable = false,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  copyable?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--bg-input)' }}
      >
        <Icon className="w-4 h-4 text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
          {label}
        </p>
        <p className={`text-[14px] font-semibold text-primary mt-0.5 break-all ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
      {copyable && <CopyButton text={value} />}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-[fadeIn_200ms_ease-out]">
      <div className="skeleton page-card h-32" />
      <div className="skeleton page-card h-48" />
      <div className="skeleton page-card h-24" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: txn, isLoading, isError } = useQuery<PopulatedTransaction>({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const res = await apiClient.get(`/transactions/${id}`)
      return res.data.data as PopulatedTransaction
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !txn) {
    return (
      <div className="flex flex-col gap-3 animate-[fadeIn_200ms_ease-out]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="error-banner">
          Transaction not found or failed to load. Please go back and try again.
        </div>
      </div>
    )
  }

  const typeConfig = getTypeConfig(txn.type)
  const TypeIcon = typeConfig.icon
  const bankName = txn.bankId && typeof txn.bankId !== 'string' ? txn.bankId.bankName : null
  const accountNumber = txn.bankId && typeof txn.bankId !== 'string' ? txn.bankId.accountNumber : null
  const ifscCode = txn.bankId && typeof txn.bankId !== 'string' ? txn.bankId.ifscCode : null
  const branch = txn.bankId && typeof txn.bankId !== 'string' ? txn.bankId.branch : null

  return (
    <div className="flex flex-col gap-3 animate-[fadeIn_200ms_ease-out]">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── Hero card: amount + status ── */}
      <div className="page-card flex flex-col items-center text-center gap-3 py-6">
        {/* Type icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${typeConfig.bgClass} border ${typeConfig.borderStyle}`}
        >
          <TypeIcon className={`w-6 h-6 ${typeConfig.colorClass}`} />
        </div>

        {/* Amount */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-muted">
            {typeConfig.label} Amount
          </p>
          <p className="text-[28px] font-extrabold text-gold mt-1">
            {formatINR(txn.amount)}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon(txn.status)}
          <StatusBadge status={txn.status as 'pending' | 'completed' | 'failed' | 'disputed'} />
        </div>
      </div>

      {/* ── Transaction details card ── */}
      <div>
        <p className="section-label mt-1">Transaction Details</p>
        <div className="page-card p-0! overflow-hidden">
          <div className="px-4">
            {/* Transaction ID */}
            <DetailRow
              icon={Hash}
              label="Transaction ID"
              value={txn._id}
              copyable
              mono
            />

            {/* Type */}
            <DetailRow
              icon={typeConfig.icon}
              label="Type"
              value={typeConfig.label}
            />

            {/* UTR Number */}
            {txn.utrNumber && (
              <DetailRow
                icon={Hash}
                label="UTR Number"
                value={txn.utrNumber}
                copyable
                mono
              />
            )}

            {/* Reference ID */}
            {txn.referenceId && (
              <DetailRow
                icon={FileText}
                label="Reference ID"
                value={txn.referenceId}
                copyable
                mono
              />
            )}

            {/* Created */}
            <DetailRow
              icon={Calendar}
              label="Created On"
              value={formatDateTime(txn.createdAt)}
            />

            {/* Updated */}
            {txn.updatedAt !== txn.createdAt && (
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={formatDateTime(txn.updatedAt)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bank details card (only if bankId populated) ── */}
      {bankName && (
        <div>
          <p className="section-label mt-1">Bank Details</p>
          <div className="page-card p-0! overflow-hidden">
            <div className="px-4">
              <DetailRow
                icon={Building2}
                label="Bank Name"
                value={bankName}
              />
              {accountNumber && (
                <DetailRow
                  icon={Hash}
                  label="Account Number"
                  value={`••••${accountNumber.slice(-4)}`}
                />
              )}
              {ifscCode && (
                <DetailRow
                  icon={Hash}
                  label="IFSC Code"
                  value={ifscCode}
                  copyable
                  mono
                />
              )}
              {branch && (
                <DetailRow
                  icon={Building2}
                  label="Branch"
                  value={branch}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Notes card ── */}
      {txn.notes && (
        <div>
          <p className="section-label mt-1">Notes</p>
          <div className="page-card">
            <p className="text-[14px] text-secondary leading-relaxed">
              {txn.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
