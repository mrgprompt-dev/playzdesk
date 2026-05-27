import { redirect } from 'next/navigation'

/**
 * /security-deposits/[id] — redirects to the generic transaction detail page.
 *
 * The /transactions/[id] page already handles all transaction types including
 * security_deposit (with Shield icon + green styling), so there's no need for
 * a duplicate page. This redirect ensures any deep links to /security-deposits/:id
 * are transparently forwarded.
 */
export default function SecurityDepositDetailPage({ params }: { params: { id: string } }) {
  redirect(`/transactions/${params.id}`)
}
