"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Link,
} from "@heroui/react";
import {
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/hooks/useAuth";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import { formatCurrency } from "@/types/assets";
import {
  useDashboardStats,
  useBeneficiaryCount,
  useWillStatus,
} from "@/hooks/useDashboard";

interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  categoryBreakdown: Record<string, number>;
  recentAssets: Array<{
    id: string;
    name: string;
    value: number;
    asset_type: string;
    created_at: string;
  }>;
}

export function DashboardClient() {
  // Component attributes - Required for visual dev mode
  const componentAttributes = {
    "data-testid": "dashboard-client",
    "data-component-category": "layout",
  };
  const { user, authError, refetchSession } = useAuth();

  // Use TanStack Query hooks
  const {
    data: stats,
    isLoading: loading,
    error: statsError,
  } = useDashboardStats();

  const { data: beneficiaryCount = 0, isLoading: beneficiaryLoading } =
    useBeneficiaryCount();

  const { data: willStatus, isLoading: willLoading } = useWillStatus();

  const hasWill = willStatus?.hasWill || false;

  const quickStats = [
    {
      label: "Total Assets",
      value: loading ? "..." : (stats?.totalAssets || 0).toString(),
      subValue: loading ? "" : formatCurrency(stats?.totalValue || 0),
      icon: CurrencyDollarIcon,
      href: "/assets",
      color: "success",
      show: (stats?.totalAssets || 0) > 0,
    },
    {
      label: "Beneficiaries",
      value: beneficiaryLoading ? "..." : beneficiaryCount.toString(),
      icon: UsersIcon,
      href: "/beneficiaries",
      color: "primary",
      show: beneficiaryCount > 0,
    },
    {
      label: "Will Status",
      value: willLoading ? "..." : willStatus?.status || "Draft",
      icon: DocumentTextIcon,
      href: "/will",
      color: "warning",
      show: hasWill,
    },
  ].filter((stat) => stat.show);

  const categoryStats =
    !loading &&
    stats &&
    stats.totalAssets > 0 &&
    Object.keys(stats.categoryBreakdown).length > 0
      ? Object.entries(stats.categoryBreakdown).map(([category, count]) => ({
          label: category
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count.toString(),
          subValue: undefined,
          icon: ArrowTrendingUpIcon,
          href: "/assets",
          color: "primary",
          show: true,
        }))
      : [];

  const allStats = [...quickStats, ...categoryStats];

  const getAssetTypeDisplay = (assetType: string) => {
    return assetType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Show authentication error handler if there are JWT issues
  if (authError) {
    return <AuthErrorHandler error={authError} onRetry={refetchSession} />;
  }

  // Error handling
  if (statsError) {
    return (
      <div {...componentAttributes}>
        <Card className="w-full">
          <CardBody className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Failed to load dashboard data. Please try again.
            </p>
            <Button
              color="primary"
              data-testid="Button-thhhfriix"
              onPress={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div {...componentAttributes}>
      {/* Welcome Header - Outside the card */}
      <div className="text-left mb-6 mt-12 ml-[2.5%]">
        <h1 className="tracking-tight inline font-semibold text-4xl md:text-5xl text-foreground">
          Welcome back,{" "}
          <span className="from-[#FF1CF7] to-[#b249f8] bg-clip-text text-transparent bg-gradient-to-b">
            {user?.first_name || "User"}
          </span>
          !
        </h1>
      </div>

      {/* Main Dashboard Content */}
      <Card className="w-full dashboard-main-card">
        <CardBody className="p-8">
          <div className="space-y-8">
            {/* Dashboard Stats - Show all stats including asset categories as individual cards */}
            {allStats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allStats.map((stat) => {
                  const IconComponent = stat.icon;

                  return (
                    <div key={stat.label}>
                      <Link href={stat.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <CardBody className="p-6">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 bg-${stat.color}-100 rounded-full`}
                              >
                                <IconComponent
                                  className={`h-6 w-6 text-${stat.color}-600`}
                                />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-foreground">
                                  {stat.value}
                                </p>
                                {stat.subValue && (
                                  <p className="text-sm font-medium text-success-600">
                                    {stat.subValue}
                                  </p>
                                )}
                                <p className="text-sm text-default-600">
                                  {stat.label}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/assets">
                    <Button
                      className="h-auto p-4 justify-start w-full"
                      startContent={<CurrencyDollarIcon className="h-5 w-5" />}
                      variant="bordered"
                    >
                      <div className="text-left">
                        <div className="font-semibold">
                          {(stats?.totalAssets || 0) === 0
                            ? "Add Your First Asset"
                            : "Manage Assets"}
                        </div>
                        <div className="text-sm text-default-600">
                          {(stats?.totalAssets || 0) === 0
                            ? "Start building your will by adding assets"
                            : `View and manage your ${stats?.totalAssets || 0} assets`}
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/beneficiaries">
                    <Button
                      className="h-auto p-4 justify-start w-full"
                      startContent={<UsersIcon className="h-5 w-5" />}
                      variant="bordered"
                    >
                      <div className="text-left">
                        <div className="font-semibold">Add Beneficiaries</div>
                        <div className="text-sm text-default-600">
                          Define who inherits your assets
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/will">
                    <Button
                      className="h-auto p-4 justify-start w-full"
                      startContent={<DocumentTextIcon className="h-5 w-5" />}
                      variant="bordered"
                    >
                      <div className="text-left">
                        <div className="font-semibold">Review Will</div>
                        <div className="text-sm text-default-600">
                          Review and finalize your will
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Button
                    className="h-auto p-4 justify-start"
                    startContent={<UserIcon className="h-5 w-5" />}
                    variant="bordered"
                  >
                    <div className="text-left">
                      <div className="font-semibold">Update Profile</div>
                      <div className="text-sm text-default-600">
                        Keep your information current
                      </div>
                    </div>
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-semibold">Recent Activity</h2>
                  {(stats?.totalAssets || 0) > 0 && (
                    <Link href="/assets">
                      <Button size="sm" variant="light">
                        View All
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                    <p className="mt-2 text-default-600">
                      Loading recent activity...
                    </p>
                  </div>
                ) : (stats?.recentAssets || []).length === 0 ? (
                  <div className="text-center py-8 text-default-600">
                    <p>No recent activity to show.</p>
                    <p className="text-sm mt-1">
                      Start by adding your assets or beneficiaries.
                    </p>
                    <Link href="/assets">
                      <Button
                        className="mt-4"
                        color="primary"
                        startContent={<PlusIcon className="h-4 w-4" />}
                        variant="flat"
                      >
                        Add Your First Asset
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(stats?.recentAssets || []).map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3 bg-default-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 rounded-full">
                            <CurrencyDollarIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-default-600">
                              {getAssetTypeDisplay(asset.asset_type)} •{" "}
                              {asset.created_at
                                ? getRelativeTime(
                                    typeof asset.created_at === "string"
                                      ? asset.created_at
                                      : asset.created_at.toISOString(),
                                  )
                                : "Unknown date"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-success-600">
                            {formatCurrency(asset.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
