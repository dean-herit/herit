import { HomePageClient } from "./components/pages/HomePageClient";

// Force dynamic rendering for auth checks
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomePageClient />;
}
