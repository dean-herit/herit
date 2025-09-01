"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function EditAssetPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to assets page since edit functionality is being rebuilt
    router.push("/assets");
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardBody className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Asset Editing</h1>
          <p className="text-default-600 mb-6">
            Asset editing functionality is being rebuilt. You&apos;ll be
            redirected to the assets page.
          </p>
          <Button
            color="primary"
            data-testid="Button-wp0a6jdlt"
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            onPress={() => router.push("/assets")}
          >
            Back to Assets
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
