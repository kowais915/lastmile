"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { getWorkspace, updateManagedPartnerNeed } from "@/lib/db";

export async function savePartnerNeed(formData: FormData) {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("Sign in to update your availability.");
  const workspace = await getWorkspace(orgId);
  if (!workspace) throw new Error("Complete workspace setup first.");
  const tags = String(formData.get("dietaryTags") ?? "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  await updateManagedPartnerNeed({
    organizationId: workspace.id, userId,
    requestedPortions: Number(formData.get("requestedPortions")),
    remainingCapacity: Number(formData.get("remainingCapacity")),
    urgency: String(formData.get("urgency")) as "routine" | "elevated" | "urgent" | "critical",
    dietaryTags: tags,
    availableUntil: new Date(String(formData.get("availableUntil"))),
  });
  revalidatePath("/partner");
  revalidatePath("/review");
  revalidatePath("/coordinator");
}
