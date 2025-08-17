import { WillClient } from "./WillClient";

import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WillPage() {
  const user = await requireAuth();

  return <WillClient user={user} />;
}
