import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import { offeringCategories, offeringSubCategories } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import OfferingsClient from "@/components/OfferingsClient";

export const revalidate = 0; // ensure dynamic SSR

export default async function OfferingsPage() {
  // Fetch initial data on the server for SSR & SEO
  const categoriesList = await db
    .select()
    .from(offeringCategories)
    .where(eq(offeringCategories.isActive, true))
    .orderBy(asc(offeringCategories.sortOrder));

  const initialData = await Promise.all(
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

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: 72 }}>
        <OfferingsClient initialData={initialData} />
      </main>
    </>
  );
}
