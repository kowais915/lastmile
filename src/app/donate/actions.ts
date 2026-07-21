"use server";

import { redirect } from "next/navigation";

import { submitDonation } from "@/lib/db";

function dateFromForm(value: FormDataEntryValue | null) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Please provide a valid date and time.");
  return date;
}

export async function createDonationSubmission(formData: FormData) {
  const portions = Number(formData.get("portions"));
  const start = dateFromForm(formData.get("collectionWindowStart"));
  const end = dateFromForm(formData.get("collectionWindowEnd"));
  const expires = dateFromForm(formData.get("expiresAt"));

  if (!Number.isInteger(portions) || portions < 1 || end <= start || expires < end) {
    throw new Error("Check portions, collection window, and expiry time.");
  }

  await submitDonation({
    organizationId: String(formData.get("organizationId")),
    donorName: String(formData.get("donorName")).trim(),
    donorEmail: String(formData.get("donorEmail")).trim(),
    donorPhone: String(formData.get("donorPhone")).trim(),
    itemName: String(formData.get("itemName")).trim(),
    portions,
    dietaryTags: String(formData.get("dietaryTags"))
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    collectionWindowStart: start,
    collectionWindowEnd: end,
    expiresAt: expires,
    notes: String(formData.get("notes")).trim(),
  });

  redirect("/donate?sent=1");
}
