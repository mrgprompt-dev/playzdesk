import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthUser } from '@/lib/getAuthUser'
import { Transaction } from '@/models/Transaction'
import type { ApiResponse } from '@/types'

// ─── GET /api/security-deposits ───────────────────────────────────────────────
// List the authenticated user's security deposits with optional filters.
//
// Query params:
//   status    – 'pending' | 'completed' | 'failed'
//   search    – partial match on referenceId
//   dateFrom  – ISO date string (inclusive)
//   dateTo    – ISO date string (inclusive, end of day)

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req)
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status   = searchParams.get('status')
    const search   = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')

    await connectDB()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      userId: auth.userId,
      type: 'security_deposit',
    }

    if (status && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      filter.status = status
    }

    if (search) {
      filter.$or = [
        { referenceId: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
      ]
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        filter.createdAt.$lte = end
      }
    }

    const deposits = await Transaction.find(filter)
      .populate('bankId', 'bankName accountNumber ifscCode branch')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'OK',
      data: deposits,
    })
  } catch (err) {
    console.error('[GET /api/security-deposits]', err)
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Failed to fetch security deposits' },
      { status: 500 }
    )
  }
}

// ─── POST /api/security-deposits ──────────────────────────────────────────────
// Create a new security deposit request.
//
// Body: { bankId: string, amount: number, notes?: string }

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req)
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { bankId, amount, notes } = body

    if (!bankId || !amount || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Bank and positive amount are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Verify bank ownership
    const { BankAccount } = await import('@/models/BankAccount')
    const bank = await BankAccount.findOne({
      _id: bankId,
      userId: auth.userId,
      status: 'active',
    })

    if (!bank) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Bank account not found or inactive' },
        { status: 404 }
      )
    }

    const txn = await Transaction.create({
      userId: auth.userId,
      type: 'security_deposit',
      amount,
      status: 'pending',
      bankId,
      notes: notes || null,
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Security deposit request submitted',
        data: txn,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/security-deposits]', err)
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Failed to create security deposit' },
      { status: 500 }
    )
  }
}
