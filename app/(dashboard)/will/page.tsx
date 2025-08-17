import { WillClient } from "./WillClient";

import { requireAuth } from "@/lib/auth";

export default async function WillPage() {
  const user = await requireAuth();

  return <WillClient user={user} />;
}
