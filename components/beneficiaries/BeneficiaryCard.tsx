"use client";

import {
  Card,
  CardBody,
  Avatar,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconMail,
  IconPhone,
  IconMapPin,
} from "@tabler/icons-react";

import {
  BeneficiaryWithPhoto,
  relationshipTypeLabels,
} from "@/types/beneficiaries";

interface BeneficiaryCardProps {
  beneficiary: BeneficiaryWithPhoto;
  onEdit?: (beneficiary: BeneficiaryWithPhoto) => void;
  onDelete?: (beneficiary: BeneficiaryWithPhoto) => void;
  onView?: (beneficiary: BeneficiaryWithPhoto) => void;
}

export function BeneficiaryCard({
  beneficiary,
  onEdit,
  onDelete,
  onView,
}: BeneficiaryCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatAddress = () => {
    const parts = [
      beneficiary.address_line_1,
      beneficiary.address_line_2,
      beneficiary.city,
      beneficiary.county,
      beneficiary.eircode,
      beneficiary.country,
    ].filter(Boolean);

    return parts.join(", ");
  };

  return (
    <Card
      isPressable
      className="w-full hover:shadow-lg transition-shadow cursor-pointer"
      data-testid={`beneficiary-card-${beneficiary.id}`}
      onPress={() => onView?.(beneficiary)}
    >
      <CardBody className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <Avatar
              className="flex-shrink-0"
              fallback={getInitials(beneficiary.name)}
              name={beneficiary.name}
              radius="lg"
              size="lg"
              src={beneficiary.photo_url || undefined}
            />

            <div className="flex flex-col gap-1 flex-grow">
              <h4 className="text-lg font-semibold">{beneficiary.name}</h4>

              <Chip className="w-fit" color="primary" size="sm" variant="flat">
                {relationshipTypeLabels[
                  beneficiary.relationship_type as keyof typeof relationshipTypeLabels
                ] || beneficiary.relationship_type}
              </Chip>

              {beneficiary.percentage && (
                <div className="text-sm text-default-500 mt-1">
                  Inheritance:{" "}
                  <span className="font-semibold">
                    {beneficiary.percentage}%
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1 mt-2">
                {beneficiary.email && (
                  <div className="flex items-center gap-2 text-sm text-default-600">
                    <IconMail size={16} />
                    <span>{beneficiary.email}</span>
                  </div>
                )}

                {beneficiary.phone && (
                  <div className="flex items-center gap-2 text-sm text-default-600">
                    <IconPhone size={16} />
                    <span>{beneficiary.phone}</span>
                  </div>
                )}

                {formatAddress() && (
                  <div className="flex items-center gap-2 text-sm text-default-600">
                    <IconMapPin size={16} />
                    <span className="line-clamp-2">{formatAddress()}</span>
                  </div>
                )}
              </div>

              {beneficiary.pps_number && (
                <div className="text-xs text-default-400 mt-2">
                  PPS: {beneficiary.pps_number}
                </div>
              )}
            </div>
          </div>

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                data-testid="Button-75idmedwj"
                size="sm"
                variant="light"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDotsVertical size={18} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Beneficiary actions">
              <DropdownItem
                key="edit"
                data-testid="DropdownItem-fm4ob2gxm"
                startContent={<IconEdit size={16} />}
                onPress={() => onEdit?.(beneficiary)}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                data-testid="DropdownItem-qq5ssnwj6"
                startContent={<IconTrash size={16} />}
                onPress={() => onDelete?.(beneficiary)}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {beneficiary.conditions && (
          <div className="mt-3 p-2 bg-default-100 rounded-lg">
            <p className="text-xs text-default-600">
              <span className="font-semibold">Conditions:</span>{" "}
              {beneficiary.conditions}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
