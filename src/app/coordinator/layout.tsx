import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getMembershipRole, getWorkspace } from "@/lib/db";

export default async function CoordinatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/sign-in");
  const workspace = await getWorkspace(orgId);
  if (!workspace || await getMembershipRole(workspace.id, userId) !== "coordinator") redirect("/portal");
  return children;
}
