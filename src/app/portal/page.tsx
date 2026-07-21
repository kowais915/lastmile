import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureWorkspaceMember, getWorkspace } from "@/lib/db";

export default async function PortalPage() {
  const { orgId, userId } = await auth();
  if (!userId || !orgId) redirect("/onboarding");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");
  const role = await ensureWorkspaceMember(workspace.id, userId);
  redirect(role === "coordinator" ? "/coordinator" : role === "partner_manager" ? "/partner" : "/volunteer");
}
