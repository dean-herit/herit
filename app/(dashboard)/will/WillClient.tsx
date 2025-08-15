'use client';

import { AuthUser } from '@/lib/auth';
import { Card, CardBody, CardHeader, Button, Divider } from '@heroui/react';
import { DocumentTextIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

interface WillClientProps {
  user: AuthUser;
}

export function WillClient({ user }: WillClientProps) {
  const hasWill = false; // TODO: Check if user has a will

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Your Will
        </h1>
        <p className="text-default-600 mt-2">
          Create and manage your Last Will and Testament securely.
        </p>
      </div>

      {/* Will Status */}
      {!hasWill ? (
        <Card className="max-w-2xl">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <DocumentTextIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Create Your Will</h3>
                <p className="text-default-600">You haven't created your will yet</p>
              </div>
            </div>
          </CardHeader>
          <Divider className="my-4" />
          <CardBody className="pt-0">
            <p className="text-default-600 mb-6">
              Create a legally binding will to ensure your assets are distributed according to your wishes. 
              Our guided process makes it simple and secure.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Legally compliant with Irish law</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Secure digital signatures</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Professional legal review available</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                color="primary" 
                size="lg"
                startContent={<PlusIcon className="w-5 h-5" />}
              >
                Create Will
              </Button>
              <Button 
                variant="bordered" 
                size="lg"
                startContent={<EyeIcon className="w-5 h-5" />}
              >
                View Sample
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-success/10">
                  <DocumentTextIcon className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Last Will and Testament</h3>
                  <p className="text-default-600">Created on [Date]</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-success">Active</div>
                <div className="text-xs text-default-500">Version 1.0</div>
              </div>
            </div>
          </CardHeader>
          <Divider className="my-4" />
          <CardBody className="pt-0">
            <div className="flex gap-3">
              <Button color="primary" size="lg">
                View Will
              </Button>
              <Button variant="bordered" size="lg">
                Edit Will
              </Button>
              <Button variant="light" size="lg">
                Download PDF
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Will Templates</h4>
                <p className="text-sm text-default-600">Browse our library of will templates</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DocumentTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Legal Review</h4>
                <p className="text-sm text-default-600">Get your will reviewed by legal experts</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}