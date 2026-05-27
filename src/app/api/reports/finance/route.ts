import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import { Transaction } from "@/models/Transaction";
import type { ApiResponse, FinanceReportSummary } from "@/types";

// GET /api/reports/finance
// Returns aggregated financial summary for the authenticated user.
// Query params: dateFrom, dateTo (ISO date strings, optional)
export async function GET(req: NextRequest) {
	try {
		await connectDB();

		const auth = await getAuthUser(req);
		if (!auth) {
			return NextResponse.json<ApiResponse>(
				{ success: false, message: "Unauthorised" },
				{ status: 401 },
			);
		}

		const { searchParams } = new URL(req.url);
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");

		// Build date filter
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dateFilter: Record<string, any> = {};
		if (dateFrom || dateTo) {
			dateFilter.createdAt = {};
			if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
			if (dateTo) {
				const end = new Date(dateTo);
				end.setHours(23, 59, 59, 999);
				dateFilter.createdAt.$lte = end;
			}
		}

		const baseFilter = { userId: auth.userId, ...dateFilter };

		// Run all aggregations in parallel
		const [depositAgg, withdrawalAgg, secDepAgg, secWdrAgg] = await Promise.all(
			[
				Transaction.aggregate([
					{ $match: { ...baseFilter, type: "deposit" } },
					{
						$group: {
							_id: "$status",
							total: { $sum: "$amount" },
							count: { $sum: 1 },
						},
					},
				]),
				Transaction.aggregate([
					{ $match: { ...baseFilter, type: "withdrawal" } },
					{
						$group: {
							_id: "$status",
							total: { $sum: "$amount" },
							count: { $sum: 1 },
						},
					},
				]),
				Transaction.aggregate([
					{ $match: { ...baseFilter, type: "security_deposit" } },
					{ $group: { _id: null, total: { $sum: "$amount" } } },
				]),
				Transaction.aggregate([
					{ $match: { ...baseFilter, type: "security_withdrawal" } },
					{ $group: { _id: null, total: { $sum: "$amount" } } },
				]),
			],
		);

		// Helper to sum by status
		function sumByStatus(
			agg: { _id: string; total: number; count: number }[],
			status: string,
		) {
			return agg.find((a) => a._id === status)?.total ?? 0;
		}
		function totalAll(agg: { _id: string; total: number; count: number }[]) {
			return agg.reduce((s, a) => s + a.total, 0);
		}

		const totalDeposits = totalAll(depositAgg);
		const totalWithdrawals = totalAll(withdrawalAgg);
		const completedDeposits = sumByStatus(depositAgg, "completed");
		const completedWithdrawals = sumByStatus(withdrawalAgg, "completed");
		const pendingDeposits = sumByStatus(depositAgg, "pending");
		const pendingWithdrawals = sumByStatus(withdrawalAgg, "pending");
		const totalSecurityDeposits = secDepAgg[0]?.total ?? 0;
		const totalSecurityWithdrawals = secWdrAgg[0]?.total ?? 0;

		const summary: FinanceReportSummary = {
			totalDeposits,
			totalWithdrawals,
			totalSecurityDeposits,
			totalSecurityWithdrawals,
			netBalance: completedDeposits - completedWithdrawals,
			pendingDeposits,
			pendingWithdrawals,
			completedDeposits,
			completedWithdrawals,
			dateFrom: dateFrom ?? null,
			dateTo: dateTo ?? null,
		};

		return NextResponse.json<ApiResponse<FinanceReportSummary>>({
			success: true,
			message: "Finance report fetched",
			data: summary,
		});
	} catch (err) {
		console.error("[GET /api/reports/finance]", err);
		return NextResponse.json<ApiResponse>(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
