'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Divider, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/react';
import { PlusIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function AssetsPage() {
  const [assets] = useState([]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="text-default-600 mt-1">
            Manage your assets that will be included in your will
          </p>
        </div>
        <Button 
          color="primary" 
          startContent={<PlusIcon className="h-4 w-4" />}
        >
          Add Asset
        </Button>
      </div>

      {/* Assets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-default-600">Total Value</p>
                <p className="text-xl font-semibold">€0</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <span className="text-sm font-semibold text-primary-600">📊</span>
              </div>
              <div>
                <p className="text-sm text-default-600">Total Assets</p>
                <p className="text-xl font-semibold">{assets.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <span className="text-sm font-semibold text-warning-600">⚠️</span>
              </div>
              <div>
                <p className="text-sm text-default-600">Unassigned</p>
                <p className="text-xl font-semibold">0</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Your Assets</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          {assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="h-8 w-8 text-default-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No assets added yet</h3>
              <p className="text-default-600 mb-6">
                Start building your will by adding your assets
              </p>
              <Button 
                color="primary" 
                startContent={<PlusIcon className="h-4 w-4" />}
              >
                Add Your First Asset
              </Button>
            </div>
          ) : (
            <Table aria-label="Assets table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>VALUE</TableColumn>
                <TableColumn>BENEFICIARY</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {[].map((asset: any) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell>{asset.value}</TableCell>
                    <TableCell>{asset.beneficiary || 'Unassigned'}</TableCell>
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