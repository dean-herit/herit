import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/db";
import { beneficiaries } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { beneficiaryFormSchema } from "@/types/beneficiaries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const beneficiary = await db
      .select()
      .from(beneficiaries)
      .where(
        and(
          eq(beneficiaries.id, id),
          eq(beneficiaries.user_email, session.user.email),
        ),
      )
      .limit(1);

    if (!beneficiary[0]) {
      return NextResponse.json(
        { error: "Beneficiary not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(beneficiary[0]);
  } catch (error) {
    console.error("Error fetching beneficiary:", error);

    return NextResponse.json(
      { error: "Failed to fetch beneficiary" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validatedData = beneficiaryFormSchema.parse(body);

    const cleanedData = {
      ...validatedData,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      pps_number: validatedData.pps_number || null,
      photo_url: validatedData.photo_url || null,
      address_line_1: validatedData.address_line_1 || null,
      address_line_2: validatedData.address_line_2 || null,
      city: validatedData.city || null,
      county: validatedData.county || null,
      eircode: validatedData.eircode || null,
      conditions: validatedData.conditions || null,
      specific_assets: validatedData.specific_assets || null,
    };

    const [updatedBeneficiary] = await db
      .update(beneficiaries)
      .set({
        ...cleanedData,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(beneficiaries.id, id),
          eq(beneficiaries.user_email, session.user.email),
        ),
      )
      .returning();

    if (!updatedBeneficiary) {
      return NextResponse.json(
        { error: "Beneficiary not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedBeneficiary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating beneficiary:", error);

    return NextResponse.json(
      { error: "Failed to update beneficiary" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deletedBeneficiary] = await db
      .update(beneficiaries)
      .set({
        status: "deleted",
        updated_at: new Date(),
      })
      .where(
        and(
          eq(beneficiaries.id, id),
          eq(beneficiaries.user_email, session.user.email),
        ),
      )
      .returning();

    if (!deletedBeneficiary) {
      return NextResponse.json(
        { error: "Beneficiary not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Beneficiary deleted successfully" });
  } catch (error) {
    console.error("Error deleting beneficiary:", error);

    return NextResponse.json(
      { error: "Failed to delete beneficiary" },
      { status: 500 },
    );
  }
}
