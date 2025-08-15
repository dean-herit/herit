'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Divider, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/react';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function BeneficiariesPage() {
  const [beneficiaries] = useState([]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beneficiaries</h1>
          <p className="text-default-600 mt-1">
            Manage the people and organizations who will inherit your assets
          </p>
        </div>
        <Button 
          color="primary" 
          startContent={<PlusIcon className="h-4 w-4" />}
        >
          Add Beneficiary
        </Button>
      </div>

      {/* Beneficiaries Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-default-600">Total Beneficiaries</p>
                <p className="text-xl font-semibold">{beneficiaries.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <span className="text-sm font-semibold text-success-600">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <p className="text-sm text-default-600">Family Members</p>
                <p className="text-xl font-semibold">0</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <span className="text-sm font-semibold text-secondary-600">🏢</span>
              </div>
              <div>
                <p className="text-sm text-default-600">Organizations</p>
                <p className="text-xl font-semibold">0</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Beneficiaries List */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Your Beneficiaries</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          {beneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-default-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No beneficiaries added yet</h3>
              <p className="text-default-600 mb-6">
                Add family members, friends, or organizations who will inherit your assets
              </p>
              <Button 
                color="primary" 
                startContent={<PlusIcon className="h-4 w-4" />}
              >
                Add Your First Beneficiary
              </Button>
            </div>
          ) : (
            <Table aria-label="Beneficiaries table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>RELATIONSHIP</TableColumn>
                <TableColumn>CONTACT</TableColumn>
                <TableColumn>ASSETS ASSIGNED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {[].map((beneficiary: any) => (
                  <TableRow key={beneficiary.id}>
                    <TableCell>{beneficiary.name}</TableCell>
                    <TableCell>{beneficiary.relationship}</TableCell>
                    <TableCell>{beneficiary.contact}</TableCell>
                    <TableCell>{beneficiary.assetsCount || 0}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="light">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}