import { requireAuth } from '@/lib/auth'
import { WillClient } from './WillClient'

export default async function WillPage() {
  const user = await requireAuth()

  return <WillClient user={user} />
}