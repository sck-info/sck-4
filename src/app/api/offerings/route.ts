import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offeringCategories, offeringSubCategories } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET() {
  try {
    const categoriesList = await db
      .select()
      .from(offeringCategories)
      .where(eq(offeringCategories.isActive, true))
      .orderBy(asc(offeringCategories.sortOrder));

    const data = await Promise.all(
      categoriesList.map(async (category) => {
        const subCategoriesList = await db
          .select()
          .from(offeringSubCategories)
          .where(
            and(
              eq(offeringSubCategories.categoryId, category.id),
              eq(offeringSubCategories.isActive, true)
            )
          )
          .orderBy(asc(offeringSubCategories.sortOrder));

        return {
          ...category,
          subCategories: subCategoriesList,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET offerings public error:", err);
    return NextResponse.json({ error: "Failed to fetch offerings" }, { status: 500 });
  }
}
