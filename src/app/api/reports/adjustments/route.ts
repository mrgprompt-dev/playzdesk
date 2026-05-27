import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import Adjustment from "@/models/Adjustment";
import type { AdjustmentsResponse, ApiResponse, IAdjustment } from "@/types";

// GET /api/reports/adjustments
// Returns all adjustment records for the authenticated user.
// Query params: dateFrom, dateTo, type ('credit' | 'debit')
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
		const type = searchParams.get("type");
		const search = searchParams.get("search");

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const filter: Record<string, any> = { userId: auth.userId };

		if (type && ["credit", "debit"].includes(type)) {
			filter.type = type;
		}

		if (search) {
			filter.$or = [
				{ description: { $regex: search.trim(), $options: "i" } },
				{ referenceId: { $regex: search.trim(), $options: "i" } },
			];
		}

		if (dateFrom || dateTo) {
			filter.createdAt = {};
			if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
			if (dateTo) {
				const end = new Date(dateTo);
				end.setHours(23, 59, 59, 999);
				filter.createdAt.$lte = end;
			}
		}

		const records = await Adjustment.find(filter)
			.sort({ createdAt: -1 })
			.lean();

		const mapped: IAdjustment[] = records.map((r) => ({
			_id: String(r._id),
			type: r.type,
			amount: r.amount,
			description: r.description,
			referenceId: r.referenceId,
			createdAt: r.createdAt.toISOString(),
		}));

		const totalCredit = mapped
			.filter((r) => r.type === "credit")
			.reduce((s, r) => s + r.amount, 0);
		const totalDebit = mapped
			.filter((r) => r.type === "debit")
			.reduce((s, r) => s + r.amount, 0);

		return NextResponse.json<ApiResponse<AdjustmentsResponse>>({
			success: true,
			message: "Adjustments fetched",
			data: {
				totalCredit,
				totalDebit,
				net: totalCredit - totalDebit,
				records: mapped,
			},
		});
	} catch (err) {
		console.error("[GET /api/reports/adjustments]", err);
		return NextResponse.json<ApiResponse>(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
