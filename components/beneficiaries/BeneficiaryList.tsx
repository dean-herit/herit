"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Select,
  SelectItem,
  Pagination,
  Spinner,
} from "@heroui/react";
import {
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
} from "@tabler/icons-react";

import {
  BeneficiaryWithPhoto,
  relationshipTypeLabels,
} from "@/types/beneficiaries";

interface BeneficiaryListProps {
  beneficiaries: BeneficiaryWithPhoto[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (search: string) => void;
  onFilterChange?: (filter: { relationship_type?: string }) => void;
  onEdit?: (beneficiary: BeneficiaryWithPhoto) => void;
  onDelete?: (beneficiary: BeneficiaryWithPhoto) => void;
  onView?: (beneficiary: BeneficiaryWithPhoto) => void;
}

export function BeneficiaryList({
  beneficiaries,
  total,
  page,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  onEdit,
  onDelete,
  onView,
}: BeneficiaryListProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleRelationshipFilter = (value: string) => {
    setSelectedRelationship(value);
    onFilterChange?.({ relationship_type: value || undefined });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatAddress = (beneficiary: BeneficiaryWithPhoto) => {
    const parts = [beneficiary.city, beneficiary.county].filter(Boolean);

    return parts.join(", ");
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns = [
    { key: "name", label: "Name" },
    { key: "relationship", label: "Relationship" },
    { key: "contact", label: "Contact" },
    { key: "address", label: "Address" },
    { key: "percentage", label: "Inheritance" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div
      className="space-y-4"
      data-component-category="data-display"
      data-component-id="beneficiary-list"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <Input
          className="flex-1"
          data-testid="beneficiary-search"
          placeholder="Search beneficiaries..."
          startContent={
            <IconSearch
              data-component-category="ui"
              data-component-id="icon-search"
              size={18}
            />
          }
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <Select
          className="w-full sm:w-48"
          data-component-category="ui"
          data-component-id="select"
          data-testid="beneficiary-filter"
          placeholder="All relationships"
          selectedKeys={selectedRelationship ? [selectedRelationship] : []}
          onChange={(e) => handleRelationshipFilter(e.target.value)}
        >
          {[
            <SelectItem
              key=""
              data-component-category="ui"
              data-component-id="select-item"
            >
              All relationships
            </SelectItem>,
            ...Object.entries(relationshipTypeLabels).map(([value, label]) => (
              <SelectItem
                key={value}
                data-component-category="ui"
                data-component-id="select-item"
              >
                {label}
              </SelectItem>
            )),
          ]}
        </Select>
      </div>

      <Table
        aria-label="Beneficiaries table"
        bottomContent={
          totalPages > 1 && (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                data-component-category="ui"
                data-component-id="pagination"
                page={page}
                total={totalPages}
                onChange={onPageChange}
              />
            </div>
          )
        }
        data-component-category="ui"
        data-component-id="table"
      >
        <TableHeader
          columns={columns}
          data-component-category="ui"
          data-component-id="table-header"
        >
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.key === "actions" ? "center" : "start"}
              data-component-category="ui"
              data-component-id="table-column"
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          data-component-category="ui"
          data-component-id="table-body"
          emptyContent="No beneficiaries found"
          items={beneficiaries}
          loadingContent={
            <Spinner data-component-category="ui" data-component-id="spinner" />
          }
          loadingState={loading ? "loading" : "idle"}
        >
          {(item) => (
            <TableRow
              key={item.id}
              data-component-category="ui"
              data-component-id="table-row"
              data-testid={`beneficiary-row-${item.id}`}
            >
              <TableCell
                data-component-category="ui"
                data-component-id="table-cell"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    data-component-category="ui"
                    data-component-id="avatar"
                    fallback={getInitials(item.name)}
                    name={item.name}
                    size="sm"
                    src={item.photo_url || undefined}
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.pps_number && (
                      <p className="text-xs text-default-400">
                        PPS: {item.pps_number}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell
                data-component-category="ui"
                data-component-id="table-cell"
              >
                <Chip
                  color="primary"
                  data-component-category="ui"
                  data-component-id="chip"
                  size="sm"
                  variant="flat"
                >
                  {relationshipTypeLabels[
                    item.relationship_type as keyof typeof relationshipTypeLabels
                  ] || item.relationship_type}
                </Chip>
              </TableCell>

              <TableCell
                data-component-category="ui"
                data-component-id="table-cell"
              >
                <div className="flex flex-col gap-1">
                  {item.email && <p className="text-sm">{item.email}</p>}
                  {item.phone && (
                    <p className="text-sm text-default-500">{item.phone}</p>
                  )}
                  {!item.email && !item.phone && (
                    <p className="text-sm text-default-400">No contact info</p>
                  )}
                </div>
              </TableCell>

              <TableCell
                data-component-category="ui"
                data-component-id="table-cell"
              >
                <p className="text-sm">
                  {formatAddress(item) || (
                    <span className="text-default-400">No address</span>
                  )}
                </p>
              </TableCell>

              <TableCell
                data-component-category="ui"
                data-component-id="table-cell"
              >
                {item.percentage ? (
                  <div className="font-semibold">{item.percentage}%</div>
                ) : (
                  <span className="text-default-400">-</span>
                )}
              </TableCell>

              <TableCell
                data-component-category="ui"
                data-component-id="table-cell"
              >
                <Dropdown
                  data-component-category="ui"
                  data-component-id="dropdown"
                  placement="bottom-end"
                >
                  <DropdownTrigger
                    data-component-category="ui"
                    data-component-id="dropdown-trigger"
                  >
                    <Button
                      isIconOnly
                      data-testid={`beneficiary-actions-${item.id}`}
                      size="sm"
                      variant="light"
                    >
                      <IconDotsVertical
                        data-component-category="ui"
                        data-component-id="icon-dots-vertical"
                        size={18}
                      />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Beneficiary actions"
                    data-component-category="ui"
                    data-component-id="dropdown-menu"
                  >
                    <DropdownItem
                      key="view"
                      data-component-category="ui"
                      data-component-id="dropdown-item"
                      startContent={
                        <IconEye
                          data-component-category="ui"
                          data-component-id="icon-eye"
                          size={16}
                        />
                      }
                      onPress={() => onView?.(item)}
                    >
                      View
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      data-component-category="ui"
                      data-component-id="dropdown-item"
                      startContent={
                        <IconEdit
                          data-component-category="ui"
                          data-component-id="icon-edit"
                          size={16}
                        />
                      }
                      onPress={() => onEdit?.(item)}
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
                        <IconTrash
                          data-component-category="ui"
                          data-component-id="icon-trash"
                          size={16}
                        />
                      }
                      onPress={() => onDelete?.(item)}
                    >
                      Delete
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
