'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { UserIcon, DocumentTextIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline';

export function DashboardClient() {
  const { user } = useAuth();

  const quickStats = [
    {
      label: 'Assets',
      value: '0',
      icon: CurrencyDollarIcon,
      href: '/assets',
    },
    {
      label: 'Beneficiaries',
      value: '0',
      icon: UsersIcon,
      href: '/beneficiaries',
    },
    {
      label: 'Will Status',
      value: 'Draft',
      icon: DocumentTextIcon,
      href: '/will',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-default-600 mt-2">
          Manage your estate planning and keep your legacy secure.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-default-600">{stat.label}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="h-auto p-4 justify-start"
              variant="bordered"
              startContent={<CurrencyDollarIcon className="h-5 w-5" />}
            >
              <div className="text-left">
                <div className="font-semibold">Add Assets</div>
                <div className="text-sm text-default-600">Add your assets to your will</div>
              </div>
            </Button>
            
            <Button 
              className="h-auto p-4 justify-start"
              variant="bordered"
              startContent={<UsersIcon className="h-5 w-5" />}
            >
              <div className="text-left">
                <div className="font-semibold">Add Beneficiaries</div>
                <div className="text-sm text-default-600">Define who inherits your assets</div>
              </div>
            </Button>
            
            <Button 
              className="h-auto p-4 justify-start"
              variant="bordered"
              startContent={<DocumentTextIcon className="h-5 w-5" />}
            >
              <div className="text-left">
                <div className="font-semibold">Review Will</div>
                <div className="text-sm text-default-600">Review and finalize your will</div>
              </div>
            </Button>
            
            <Button 
              className="h-auto p-4 justify-start"
              variant="bordered"
              startContent={<UserIcon className="h-5 w-5" />}
            >
              <div className="text-left">
                <div className="font-semibold">Update Profile</div>
                <div className="text-sm text-default-600">Keep your information current</div>
              </div>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="text-center py-8 text-default-600">
            <p>No recent activity to show.</p>
            <p className="text-sm">Start by adding your assets or beneficiaries.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}