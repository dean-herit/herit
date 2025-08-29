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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <Input
          className="flex-1"
          data-testid="beneficiary-search"
          placeholder="Search beneficiaries..."
          startContent={<IconSearch size={18} />}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <Select
          className="w-full sm:w-48"
          data-testid="beneficiary-filter"
          placeholder="All relationships"
          selectedKeys={selectedRelationship ? [selectedRelationship] : []}
          onChange={(e) => handleRelationshipFilter(e.target.value)}
        >
          {[
            <SelectItem key="">All relationships</SelectItem>,
            ...Object.entries(relationshipTypeLabels).map(([value, label]) => (
              <SelectItem key={value}>{label}</SelectItem>
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
                page={page}
                total={totalPages}
                onChange={onPageChange}
              />
            </div>
          )
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.key === "actions" ? "center" : "start"}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent="No beneficiaries found"
          items={beneficiaries}
          loadingContent={<Spinner />}
          loadingState={loading ? "loading" : "idle"}
        >
          {(item) => (
            <TableRow key={item.id} data-testid={`beneficiary-row-${item.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
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

              <TableCell>
                <Chip color="primary" size="sm" variant="flat">
                  {relationshipTypeLabels[
                    item.relationship_type as keyof typeof relationshipTypeLabels
                  ] || item.relationship_type}
                </Chip>
              </TableCell>

              <TableCell>
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

              <TableCell>
                <p className="text-sm">
                  {formatAddress(item) || (
                    <span className="text-default-400">No address</span>
                  )}
                </p>
              </TableCell>

              <TableCell>
                {item.percentage ? (
                  <div className="font-semibold">{item.percentage}%</div>
                ) : (
                  <span className="text-default-400">-</span>
                )}
              </TableCell>

              <TableCell>
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      data-testid={`beneficiary-actions-${item.id}`}
                      size="sm"
                      variant="light"
                    >
                      <IconDotsVertical size={18} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Beneficiary actions">
                    <DropdownItem
                      key="view"
                      startContent={<IconEye size={16} />}
                      onPress={() => onView?.(item)}
                    >
                      View
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      startContent={<IconEdit size={16} />}
                      onPress={() => onEdit?.(item)}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<IconTrash size={16} />}
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
