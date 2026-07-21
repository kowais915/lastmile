"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { getMembershipRole, getWorkspace, recordMemberInvitation } from "@/lib/db";

export async function inviteTeamMember(formData: FormData) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Sign in to invite a teammate.");
  const workspace = await getWorkspace(orgId);
  if (!workspace || await getMembershipRole(workspace.id, userId) !== "coordinator") throw new Error("Only coordinators can invite teammates.");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestedRole = String(formData.get("role") ?? "");
  const partnerId = String(formData.get("partnerId") ?? "") || null;
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
  if (requestedRole !== "volunteer" && requestedRole !== "partner_manager") throw new Error("Choose a supported team role.");
  if (requestedRole === "partner_manager" && !partnerId) throw new Error("Assign the partner manager to a partner.");

  const clerk = await clerkClient();
  const invitation = await clerk.organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress: email,
    role: "org:member",
    inviterUserId: userId,
    redirectUrl: "/portal",
    privateMetadata: { lastmileRole: requestedRole, partnerId },
  });
  await recordMemberInvitation({
    organizationId: workspace.id,
    email,
    role: requestedRole,
    partnerId,
    clerkInvitationId: invitation.id,
    createdBy: userId,
  });
  revalidatePath("/team");
}
