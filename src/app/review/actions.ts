"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { approveSubmission, getWorkspace } from "@/lib/db";

export async function approveDonationSubmission(formData: FormData) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Sign in to approve a submission.");
  const workspace = await getWorkspace(orgId);
  if (!workspace) throw new Error("Complete workspace setup before reviewing donations.");
  await approveSubmission({ submissionId: String(formData.get("submissionId")), organizationId: workspace.id, userId });
  revalidatePath("/review");
}
