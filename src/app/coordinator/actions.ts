"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { confirmAllocationPlan, getWorkspace } from "@/lib/db";

export async function dispatchAllocationPlan(formData: FormData) {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) throw new Error("Sign in to dispatch a plan.");
  const workspace = await getWorkspace(orgId);
  if (!workspace) throw new Error("Complete workspace setup first.");
  await confirmAllocationPlan({ organizationId: workspace.id, userId, planId: String(formData.get("planId") ?? "") });
  revalidatePath("/coordinator");
  revalidatePath("/volunteer");
}
