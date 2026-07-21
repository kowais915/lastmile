"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { advanceVolunteerTask, claimVolunteerTask, getWorkspace } from "@/lib/db";

export async function updatePickupTask(formData: FormData) {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("Sign in to update a pickup.");
  const workspace = await getWorkspace(orgId);
  if (!workspace) throw new Error("Complete workspace setup first.");
  const taskId = String(formData.get("taskId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (action === "claim") await claimVolunteerTask({ organizationId: workspace.id, userId, taskId });
  else if (action === "collected" || action === "delivered") await advanceVolunteerTask({ organizationId: workspace.id, userId, taskId, nextStatus: action });
  else throw new Error("Unknown pickup action.");
  revalidatePath("/volunteer");
  revalidatePath("/coordinator");
}
