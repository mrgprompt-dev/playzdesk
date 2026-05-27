import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/getAuthUser";
import type { ApiResponse, ITier, TiersResponse } from "@/types";


// Tier definitions — these are static config, not stored in DB
const TIERS: ITier[] = [
	{
		id: "bronze",
		name: "Bronze",
		minDeposit: 0,
		maxWithdrawalPerTxn: 10000,
		commissionRate: 0.5,
		color: "#cd7f32",
		benefits: [
			{ label: "Max Withdrawal/Txn", value: "₹10,000" },
			{ label: "Commission Rate", value: "0.5%" },
			{ label: "Live Pool Access", value: "Basic" },
			{ label: "Support Priority", value: "Standard" },
		],
	},
	{
		id: "silver",
		name: "Silver",
		minDeposit: 50000,
		maxWithdrawalPerTxn: 25000,
		commissionRate: 1.0,
		color: "#94a3b8",
		benefits: [
			{ label: "Max Withdrawal/Txn", value: "₹25,000" },
			{ label: "Commission Rate", value: "1.0%" },
			{ label: "Live Pool Access", value: "Standard" },
			{ label: "Support Priority", value: "Priority" },
		],
	},
	{
		id: "gold",
		name: "Gold",
		minDeposit: 200000,
		maxWithdrawalPerTxn: 40000,
		commissionRate: 1.5,
		color: "#f5a623",
		benefits: [
			{ label: "Max Withdrawal/Txn", value: "₹40,000" },
			{ label: "Commission Rate", value: "1.5%" },
			{ label: "Live Pool Access", value: "Priority" },
			{ label: "Support Priority", value: "VIP" },
		],
	},
	{
		id: "platinum",
		name: "Platinum",
		minDeposit: 500000,
		maxWithdrawalPerTxn: 100000,
		commissionRate: 2.0,
		color: "#60a5fa",
		benefits: [
			{ label: "Max Withdrawal/Txn", value: "₹1,00,000" },
			{ label: "Commission Rate", value: "2.0%" },
			{ label: "Live Pool Access", value: "Unlimited" },
			{ label: "Support Priority", value: "Dedicated" },
		],
	},
];

// GET /api/tiers
// Returns all tier definitions + the user's current tier + progress to next.
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

		const { Transaction } = await import("@/models/Transaction");

		// Sum all completed deposits for this user
		const agg = await Transaction.aggregate([
			{
				$match: {
					userId: auth.userId,
					type: "deposit",
					status: "completed",
				},
			},
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]);

		const totalCompletedDeposits: number = agg[0]?.total ?? 0;

		// Determine current tier (highest tier whose minDeposit <= total)
		let currentTier = TIERS[0];
		for (const tier of TIERS) {
			if (totalCompletedDeposits >= tier.minDeposit) {
				currentTier = tier;
			}
		}

		// Next tier
		const currentIndex = TIERS.findIndex((t) => t.id === currentTier.id);
		const nextTier =
			currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null;

		// Progress toward next tier
		let progressPercent = 100;
		if (nextTier) {
			const range = nextTier.minDeposit - currentTier.minDeposit;
			const done = totalCompletedDeposits - currentTier.minDeposit;
			progressPercent = Math.min(100, Math.round((done / range) * 100));
		}

		return NextResponse.json<ApiResponse<TiersResponse>>({
			success: true,
			message: "Tiers fetched",
			data: {
				allTiers: TIERS,
				currentTier,
				nextTier,
				progressPercent,
				totalCompletedDeposits,
			},
		});
	} catch (err) {
		console.error("[GET /api/tiers]", err);
		return NextResponse.json<ApiResponse>(
			{ success: false, message: "Internal server error" },
			{ status: 500 },
		);
	}
}
