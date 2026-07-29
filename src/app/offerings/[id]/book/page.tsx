import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import { offeringSubCategories, subCategoryQuestions, formQuestions, paymentQrs } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import BookingClient from "@/components/BookingClient";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function BookOfferingPage({
  params,
}: {
  params: Promise<any>;
}) {
  const { id } = await params;

  // Fetch offering sub-category details
  const subCategoryList = await db
    .select()
    .from(offeringSubCategories)
    .where(eq(offeringSubCategories.id, id))
    .limit(1);

  if (subCategoryList.length === 0) {
    notFound();
  }

  const subCategory = subCategoryList[0];

  // Fetch payment QR if mapped
  let paymentQr = null;
  if (subCategory.paymentQrId) {
    const qrList = await db
      .select()
      .from(paymentQrs)
      .where(eq(paymentQrs.id, subCategory.paymentQrId))
      .limit(1);
    if (qrList.length > 0) {
      paymentQr = qrList[0];
    }
  }

  // Fetch linked form questions in sort order
  const linkedQuestions = await db
    .select({
      id: formQuestions.id,
      fieldLabel: formQuestions.fieldLabel,
      fieldType: formQuestions.fieldType,
      options: formQuestions.options,
      allowOther: formQuestions.allowOther,
      isRequired: subCategoryQuestions.isRequired,
      sortOrder: subCategoryQuestions.sortOrder,
    })
    .from(subCategoryQuestions)
    .innerJoin(formQuestions, eq(subCategoryQuestions.questionId, formQuestions.id))
    .where(eq(subCategoryQuestions.subCategoryId, id))
    .orderBy(asc(subCategoryQuestions.sortOrder));

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: 72 }}>
        <BookingClient
          subCategory={subCategory}
          paymentQr={paymentQr}
          initialQuestions={linkedQuestions}
        />
      </main>
    </>
  );
}
