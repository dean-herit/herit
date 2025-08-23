"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  PlusIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

import { AssetCategoryDefinitions, formatCurrency } from "@/types/assets";
import { useAssets, useDeleteAsset } from "@/hooks/useAssets";

export default function AssetsPage() {
  const router = useRouter();

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Use TanStack Query hook for assets
  const {
    data: assetsResponse,
    isLoading: loading,
    error,
  } = useAssets({
    search: searchTerm,
    category: selectedCategory,
    sort_by: sortBy,
    sort_order: sortOrder,
    limit: "50",
  });

  const deleteAssetMutation = useDeleteAsset();

  const assets = assetsResponse?.data.assets || [];
  const summary = assetsResponse?.data.summary || {
    totalValue: 0,
    assetCount: 0,
    categoryBreakdown: {} as Record<string, number>,
  };

  const handleDeleteAsset = (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    deleteAssetMutation.mutate(assetId, {
      onError: (error) => {
        console.error("Error deleting asset:", error);
        alert("Failed to delete asset. Please try again.");
      },
    });
  };

  const handleAddAsset = () => {
    router.push("/assets/add");
  };

  const getAssetTypeDisplay = (assetType: string) => {
    // Convert snake_case to Title Case
    return assetType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCategoryChipColor = (assetType: string) => {
    if (assetType.includes("bank") || assetType.includes("investment"))
      return "success";
    if (assetType.includes("property")) return "primary";
    if (assetType.includes("business")) return "warning";
    if (assetType.includes("digital")) return "secondary";

    return "default";
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Assets</h1>
            <p className="text-default-600 mt-1">
              Manage and track your estate assets
            </p>
          </div>
        </div>
        <Card>
          <CardBody className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Failed to load assets. Please try again.
            </p>
            <Button color="primary" onPress={() => window.location.reload()}>
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={
              <PlusIcon
                className="h-4 w-4"
                data-component-category="ui"
                data-component-id="plus-icon"
              />
            }
            onPress={handleAddAsset}
          >
            Add Asset
          </Button>
        </div>
      </div>

      {/* Assets Summary - Only show if user has assets */}
      {(assets.length > 0 || searchTerm || selectedCategory) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CurrencyDollarIcon
                      className="h-5 w-5 text-success-600"
                      data-component-category="ui"
                      data-component-id="currency-dollar-icon"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Total Value</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(summary.totalValue)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <span className="text-sm font-semibold text-primary-600">
                      📊
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Total Assets</p>
                    <p className="text-xl font-semibold">
                      {summary.assetCount}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <span className="text-sm font-semibold text-warning-600">
                      ⚠️
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Categories</p>
                    <p className="text-xl font-semibold">
                      {Object.keys(summary.categoryBreakdown).length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  className="md:max-w-xs"
                  placeholder="Search assets..."
                  startContent={
                    <MagnifyingGlassIcon
                      className="h-4 w-4 text-default-400"
                      data-component-category="ui"
                      data-component-id="magnifying-glass-icon"
                    />
                  }
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />

                <Select
                  className="md:max-w-xs"
                  data-component-category="ui"
                  data-component-id="select"
                  placeholder="All categories"
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  startContent={
                    <FunnelIcon
                      className="h-4 w-4 text-default-400"
                      data-component-category="ui"
                      data-component-id="funnel-icon"
                    />
                  }
                  onSelectionChange={(keys) => {
                    const category = Array.from(keys)[0] as string;

                    setSelectedCategory(category || "");
                  }}
                >
                  {Object.entries(AssetCategoryDefinitions).map(
                    ([key, category]) => (
                      <SelectItem
                        key={key}
                        data-component-category="ui"
                        data-component-id="select-item"
                      >
                        {category.icon} {category.name}
                      </SelectItem>
                    ),
                  )}
                </Select>

                <Select
                  className="md:max-w-xs"
                  data-component-category="ui"
                  data-component-id="select"
                  placeholder="Sort by"
                  selectedKeys={[sortBy]}
                  onSelectionChange={(keys) => {
                    const sort = Array.from(keys)[0] as string;

                    setSortBy(sort);
                  }}
                >
                  <SelectItem
                    key="created_at"
                    data-component-category="ui"
                    data-component-id="select-item"
                  >
                    Date Created
                  </SelectItem>
                  <SelectItem
                    key="name"
                    data-component-category="ui"
                    data-component-id="select-item"
                  >
                    Name
                  </SelectItem>
                  <SelectItem
                    key="value"
                    data-component-category="ui"
                    data-component-id="select-item"
                  >
                    Value
                  </SelectItem>
                  <SelectItem
                    key="asset_type"
                    data-component-category="ui"
                    data-component-id="select-item"
                  >
                    Type
                  </SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Assets List */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Your Assets</h2>
        </CardHeader>
        <Divider data-component-category="ui" data-component-id="divider" />
        <CardBody>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-default-600">Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon
                  className="h-8 w-8 text-default-400"
                  data-component-category="ui"
                  data-component-id="currency-dollar-icon"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || selectedCategory
                  ? "No assets found"
                  : "No assets added yet"}
              </h3>
              <p className="text-default-600 mb-6">
                {searchTerm || selectedCategory
                  ? "Try adjusting your search or filters"
                  : "Start building your will by adding your assets"}
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  color="primary"
                  startContent={
                    <PlusIcon
                      className="h-4 w-4"
                      data-component-category="ui"
                      data-component-id="plus-icon"
                    />
                  }
                  onPress={handleAddAsset}
                >
                  {searchTerm || selectedCategory
                    ? "Add Asset"
                    : "Add Your First Asset"}
                </Button>
              </div>
            </div>
          ) : (
            <Table
              aria-label="Assets table"
              classNames={{
                wrapper: "min-h-[200px]",
              }}
              data-component-category="ui"
              data-component-id="table"
            >
              <TableHeader
                data-component-category="ui"
                data-component-id="table-header"
              >
                <TableColumn
                  data-component-category="ui"
                  data-component-id="table-column"
                >
                  NAME
                </TableColumn>
                <TableColumn
                  data-component-category="ui"
                  data-component-id="table-column"
                >
                  TYPE
                </TableColumn>
                <TableColumn
                  data-component-category="ui"
                  data-component-id="table-column"
                >
                  VALUE
                </TableColumn>
                <TableColumn
                  data-component-category="ui"
                  data-component-id="table-column"
                >
                  STATUS
                </TableColumn>
                <TableColumn
                  data-component-category="ui"
                  data-component-id="table-column"
                  width={100}
                >
                  ACTIONS
                </TableColumn>
              </TableHeader>
              <TableBody
                data-component-category="ui"
                data-component-id="table-body"
              >
                {assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    data-component-category="ui"
                    data-component-id="table-row"
                  >
                    <TableCell
                      data-component-category="ui"
                      data-component-id="table-cell"
                    >
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        {asset.description && (
                          <p className="text-sm text-default-600 truncate max-w-xs">
                            {asset.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      data-component-category="ui"
                      data-component-id="table-cell"
                    >
                      <Chip
                        color={getCategoryChipColor(asset.asset_type)}
                        data-component-category="ui"
                        data-component-id="chip"
                        size="sm"
                        variant="flat"
                      >
                        {getAssetTypeDisplay(asset.asset_type)}
                      </Chip>
                    </TableCell>
                    <TableCell
                      data-component-category="ui"
                      data-component-id="table-cell"
                    >
                      <span className="font-medium text-success-600">
                        {formatCurrency(asset.value)}
                      </span>
                    </TableCell>
                    <TableCell
                      data-component-category="ui"
                      data-component-id="table-cell"
                    >
                      <Chip
                        color={
                          asset.status === "active" ? "success" : "default"
                        }
                        data-component-category="ui"
                        data-component-id="chip"
                        size="sm"
                        variant="flat"
                      >
                        {asset.status}
                      </Chip>
                    </TableCell>
                    <TableCell
                      data-component-category="ui"
                      data-component-id="table-cell"
                    >
                      <Dropdown
                        data-component-category="ui"
                        data-component-id="dropdown"
                      >
                        <DropdownTrigger
                          data-component-category="ui"
                          data-component-id="dropdown-trigger"
                        >
                          <Button isIconOnly size="sm" variant="light">
                            <EllipsisVerticalIcon
                              className="h-4 w-4"
                              data-component-category="ui"
                              data-component-id="ellipsis-vertical-icon"
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          data-component-category="ui"
                          data-component-id="dropdown-menu"
                        >
                          <DropdownItem
                            key="edit"
                            data-component-category="ui"
                            data-component-id="dropdown-item"
                            startContent={
                              <PencilIcon
                                className="h-4 w-4"
                                data-component-category="ui"
                                data-component-id="pencil-icon"
                              />
                            }
                            onPress={() =>
                              router.push(`/assets/${asset.id}/edit`)
                            }
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            data-component-category="ui"
                            data-component-id="dropdown-item"
                            startContent={
                              <TrashIcon
                                className="h-4 w-4"
                                data-component-category="ui"
                                data-component-id="trash-icon"
                              />
                            }
                            onPress={() => handleDeleteAsset(asset.id)}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
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
