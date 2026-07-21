"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { createWorkspace, seedStarterPartners } from "@/lib/db";

export async function finishOnboarding(input: {
  clerkOrganizationId: string;
  workspaceName: string;
  timezone: string;
}) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId || orgId !== input.clerkOrganizationId) {
    return { error: "Choose your workspace again before continuing." };
  }

  const workspaceName = input.workspaceName.trim();
  if (workspaceName.length < 2 || workspaceName.length > 80) {
    return { error: "Use a workspace name between 2 and 80 characters." };
  }

  try {
    const workspace = await createWorkspace({
      clerkOrganizationId: orgId,
      name: workspaceName,
      timezone: input.timezone,
      userId,
    });
    await seedStarterPartners(workspace.id);

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { onboardingComplete: true },
    });

    return { ok: true };
  } catch {
    return { error: "We could not create your workspace. Please try again." };
  }
}
