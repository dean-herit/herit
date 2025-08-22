import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/db";
import { beneficiaries } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { beneficiaryFormSchema } from "@/types/beneficiaries";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const relationship_type = searchParams.get("relationship_type");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * pageSize;

    let whereConditions = [eq(beneficiaries.user_email, session.user.email)];

    if (search) {
      whereConditions.push(
        or(
          like(beneficiaries.name, `%${search}%`),
          like(beneficiaries.email, `%${search}%`),
          like(beneficiaries.phone, `%${search}%`),
        )!,
      );
    }

    if (relationship_type) {
      whereConditions.push(
        eq(beneficiaries.relationship_type, relationship_type),
      );
    }

    const orderByColumn =
      {
        name: beneficiaries.name,
        created_at: beneficiaries.created_at,
        relationship_type: beneficiaries.relationship_type,
        percentage: beneficiaries.percentage,
      }[sortBy] || beneficiaries.created_at;

    const orderDirection = sortOrder === "asc" ? asc : desc;

    const [beneficiariesData, totalResult] = await Promise.all([
      db
        .select()
        .from(beneficiaries)
        .where(and(...whereConditions))
        .orderBy(orderDirection(orderByColumn))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(beneficiaries)
        .where(and(...whereConditions)),
    ]);

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      beneficiaries: beneficiariesData,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching beneficiaries:", error);

    return NextResponse.json(
      { error: "Failed to fetch beneficiaries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const [newBeneficiary] = await db
      .insert(beneficiaries)
      .values({
        user_email: session.user.email,
        ...cleanedData,
      })
      .returning();

    return NextResponse.json(newBeneficiary, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating beneficiary:", error);

    return NextResponse.json(
      { error: "Failed to create beneficiary" },
      { status: 500 },
    );
  }
}
