"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Tabs,
  Tab,
} from "@heroui/react";
import { PlusIcon, UsersIcon } from "@heroicons/react/24/outline";
import { IconUsers, IconUserHeart, IconBuilding } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useBeneficiaries,
  useCreateBeneficiary,
  useUpdateBeneficiary,
  useDeleteBeneficiary,
} from "@/hooks/useBeneficiaries";
import { BeneficiaryForm } from "@/components/beneficiaries/BeneficiaryForm";
import { BeneficiaryList } from "@/components/beneficiaries/BeneficiaryList";
import { BeneficiaryCard } from "@/components/beneficiaries/BeneficiaryCard";
import {
  BeneficiaryFormData,
  BeneficiaryWithPhoto,
  RelationshipTypes,
} from "@/types/beneficiaries";

export default function BeneficiariesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 12,
    search: "",
    relationship_type: undefined as string | undefined,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingBeneficiary, setEditingBeneficiary] =
    useState<BeneficiaryWithPhoto | null>(null);

  const { data, isLoading } = useBeneficiaries(searchParams as any);
  const createMutation = useCreateBeneficiary();
  const updateMutation = useUpdateBeneficiary(editingBeneficiary?.id || "");
  const deleteMutation = useDeleteBeneficiary();

  const beneficiaries = data?.beneficiaries || [];
  const totalBeneficiaries = data?.total || 0;

  const familyCount = beneficiaries.filter((b) =>
    [
      RelationshipTypes.SPOUSE,
      RelationshipTypes.CHILD,
      RelationshipTypes.PARENT,
      RelationshipTypes.SIBLING,
      RelationshipTypes.GRANDCHILD,
      RelationshipTypes.GRANDPARENT,
    ].includes(b.relationship_type as any),
  ).length;

  const charityCount = beneficiaries.filter(
    (b) => b.relationship_type === RelationshipTypes.CHARITY,
  ).length;

  const handleAddBeneficiary = () => {
    setEditingBeneficiary(null);
    onOpen();
  };

  const handleEditBeneficiary = (beneficiary: BeneficiaryWithPhoto) => {
    setEditingBeneficiary(beneficiary);
    onOpen();
  };

  const handleViewBeneficiary = (beneficiary: BeneficiaryWithPhoto) => {
    router.push(`/beneficiaries/${beneficiary.id}`);
  };

  const handleDeleteBeneficiary = async (beneficiary: BeneficiaryWithPhoto) => {
    if (confirm(`Are you sure you want to delete ${beneficiary.name}?`)) {
      try {
        await deleteMutation.mutateAsync(beneficiary.id);
        toast.success("Beneficiary deleted successfully");
      } catch (error) {
        toast.error("Failed to delete beneficiary");
      }
    }
  };

  const handleSubmit = async (data: BeneficiaryFormData) => {
    try {
      if (editingBeneficiary) {
        await updateMutation.mutateAsync(data);
        toast.success("Beneficiary updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Beneficiary added successfully");
      }
      onClose();
    } catch (error) {
      toast.error(
        editingBeneficiary
          ? "Failed to update beneficiary"
          : "Failed to add beneficiary",
      );
    }
  };

  const handleSearch = (search: string) => {
    setSearchParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (filter: { relationship_type?: string }) => {
    setSearchParams((prev) => ({ ...prev, ...filter, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6" data-component-id="beneficiaries-page">
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
          data-testid="add-beneficiary-button"
          startContent={<PlusIcon className="h-4 w-4" />}
          onPress={handleAddBeneficiary}
        >
          Add Beneficiary
        </Button>
      </div>

      {/* Summary Cards */}
      {totalBeneficiaries > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <IconUsers className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-default-600">
                    Total Beneficiaries
                  </p>
                  <p className="text-xl font-semibold">{totalBeneficiaries}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <IconUserHeart className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-default-600">Family Members</p>
                  <p className="text-xl font-semibold">{familyCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <IconBuilding className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-default-600">Organizations</p>
                  <p className="text-xl font-semibold">{charityCount}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Beneficiaries Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-lg font-semibold">Your Beneficiaries</h2>
            {totalBeneficiaries > 0 && (
              <Tabs
                selectedKey={viewMode}
                size="sm"
                onSelectionChange={(key) => setViewMode(key as "grid" | "list")}
              >
                <Tab key="grid" title="Grid" />
                <Tab key="list" title="List" />
              </Tabs>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          {totalBeneficiaries === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-default-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No beneficiaries added yet
              </h3>
              <p className="text-default-600 mb-6">
                Add family members, friends, or organizations who will inherit
                your assets
              </p>
              <Button
                color="primary"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={handleAddBeneficiary}
              >
                Add Your First Beneficiary
              </Button>
            </div>
          ) : viewMode === "list" ? (
            <BeneficiaryList
              beneficiaries={beneficiaries}
              loading={isLoading}
              page={searchParams.page}
              pageSize={searchParams.pageSize}
              total={totalBeneficiaries}
              onDelete={handleDeleteBeneficiary}
              onEdit={handleEditBeneficiary}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onView={handleViewBeneficiary}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Search beneficiaries..."
                  type="text"
                  value={searchParams.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <select
                  className="px-3 py-2 border rounded-lg"
                  value={searchParams.relationship_type || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      relationship_type: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All relationships</option>
                  {Object.entries(RelationshipTypes).map(([key, value]) => (
                    <option key={value} value={value}>
                      {key
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beneficiaries.map((beneficiary) => (
                  <BeneficiaryCard
                    key={beneficiary.id}
                    beneficiary={beneficiary}
                    onDelete={handleDeleteBeneficiary}
                    onEdit={handleEditBeneficiary}
                    onView={handleViewBeneficiary}
                  />
                ))}
              </div>

              {totalBeneficiaries > searchParams.pageSize && (
                <div className="flex justify-center mt-4">
                  <Button
                    isDisabled={searchParams.page === 1}
                    variant="flat"
                    onPress={() => handlePageChange(searchParams.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="mx-4 py-2">
                    Page {searchParams.page} of{" "}
                    {Math.ceil(totalBeneficiaries / searchParams.pageSize)}
                  </span>
                  <Button
                    isDisabled={
                      searchParams.page >=
                      Math.ceil(totalBeneficiaries / searchParams.pageSize)
                    }
                    variant="flat"
                    onPress={() => handlePageChange(searchParams.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="3xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>
            {editingBeneficiary ? "Edit Beneficiary" : "Add New Beneficiary"}
          </ModalHeader>
          <ModalBody>
            <BeneficiaryForm
              initialData={
                editingBeneficiary
                  ? {
                      ...editingBeneficiary,
                      country: editingBeneficiary.country || "Ireland",
                      email: editingBeneficiary.email || "",
                      phone: editingBeneficiary.phone || "",
                      pps_number: editingBeneficiary.pps_number || "",
                      photo_url: editingBeneficiary.photo_url || "",
                      address_line_1: editingBeneficiary.address_line_1 || "",
                      address_line_2: editingBeneficiary.address_line_2 || "",
                      city: editingBeneficiary.city || "",
                      county: (editingBeneficiary.county || "") as any,
                      eircode: editingBeneficiary.eircode || "",
                      percentage: editingBeneficiary.percentage,
                      specific_assets:
                        (editingBeneficiary.specific_assets as string[]) || [],
                      conditions: editingBeneficiary.conditions || "",
                    }
                  : undefined
              }
              loading={createMutation.isPending || updateMutation.isPending}
              mode={editingBeneficiary ? "edit" : "create"}
              onCancel={onClose}
              onSubmit={handleSubmit}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
