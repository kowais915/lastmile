import "server-only";

import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/env";

export type Workspace = {
  id: string;
  clerkOrganizationId: string;
  name: string;
  timezone: string;
};

export type DonationSubmission = {
  id: string;
  donorName: string;
  donorEmail: string;
  itemName: string;
  portions: number;
  dietaryTags: string[];
  collectionWindowStart: string;
  collectionWindowEnd: string;
  expiresAt: string;
  notes: string | null;
};

function sql() {
  return neon(getDatabaseUrl());
}

export async function getWorkspace(clerkOrganizationId: string) {
  const rows = await sql()`
    SELECT id, clerk_organization_id, name, timezone
    FROM organizations
    WHERE clerk_organization_id = ${clerkOrganizationId}
    LIMIT 1
  `;

  const row = rows[0] as
    | {
        id: string;
        clerk_organization_id: string;
        name: string;
        timezone: string;
      }
    | undefined;

  return row
    ? {
        id: row.id,
        clerkOrganizationId: row.clerk_organization_id,
        name: row.name,
        timezone: row.timezone,
      }
    : null;
}

export async function createWorkspace({
  clerkOrganizationId,
  name,
  timezone,
  userId,
}: {
  clerkOrganizationId: string;
  name: string;
  timezone: string;
  userId: string;
}) {
  const rows = await sql()`
    INSERT INTO organizations (clerk_organization_id, name, timezone)
    VALUES (${clerkOrganizationId}, ${name}, ${timezone})
    ON CONFLICT (clerk_organization_id)
    DO UPDATE SET name = EXCLUDED.name, timezone = EXCLUDED.timezone, updated_at = now()
    RETURNING id, clerk_organization_id, name, timezone
  `;

  const workspace = rows[0] as {
    id: string;
    clerk_organization_id: string;
    name: string;
    timezone: string;
  };

  await sql()`
    INSERT INTO memberships (organization_id, clerk_user_id, role)
    VALUES (${workspace.id}, ${userId}, 'coordinator')
    ON CONFLICT (organization_id, clerk_user_id) DO NOTHING
  `;

  return {
    id: workspace.id,
    clerkOrganizationId: workspace.clerk_organization_id,
    name: workspace.name,
    timezone: workspace.timezone,
  } satisfies Workspace;
}

export async function getPublicWorkspaces() {
  const rows = await sql()`
    SELECT id, name FROM organizations ORDER BY name ASC LIMIT 100
  `;

  return rows as Array<{ id: string; name: string }>;
}

export async function submitDonation(input: {
  organizationId: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  itemName: string;
  portions: number;
  dietaryTags: string[];
  collectionWindowStart: Date;
  collectionWindowEnd: Date;
  expiresAt: Date;
  notes?: string;
}) {
  await sql()`
    INSERT INTO donation_submissions (
      organization_id, donor_name, donor_email, donor_phone, item_name,
      portions, dietary_tags, collection_window_start, collection_window_end,
      expires_at, notes
    ) VALUES (
      ${input.organizationId}, ${input.donorName}, ${input.donorEmail},
      ${input.donorPhone || null}, ${input.itemName}, ${input.portions},
      ${input.dietaryTags}, ${input.collectionWindowStart},
      ${input.collectionWindowEnd}, ${input.expiresAt}, ${input.notes || null}
    )
  `;
}

export async function getPendingSubmissions(organizationId: string) {
  const rows = await sql()`
    SELECT id, donor_name, donor_email, item_name, portions, dietary_tags,
      collection_window_start, collection_window_end, expires_at, notes
    FROM donation_submissions
    WHERE organization_id = ${organizationId} AND status = 'pending'
    ORDER BY expires_at ASC
  `;

  return rows.map((row) => {
    const submission = row as Record<string, unknown>;
    return {
      id: String(submission.id),
      donorName: String(submission.donor_name),
      donorEmail: String(submission.donor_email),
      itemName: String(submission.item_name),
      portions: Number(submission.portions),
      dietaryTags: (submission.dietary_tags as string[]) ?? [],
      collectionWindowStart: new Date(String(submission.collection_window_start)).toISOString(),
      collectionWindowEnd: new Date(String(submission.collection_window_end)).toISOString(),
      expiresAt: new Date(String(submission.expires_at)).toISOString(),
      notes: submission.notes ? String(submission.notes) : null,
    } satisfies DonationSubmission;
  });
}

export async function approveSubmission({
  submissionId,
  organizationId,
  userId,
}: {
  submissionId: string;
  organizationId: string;
  userId: string;
}) {
  const rows = await sql()`
    SELECT id, donor_name, item_name, portions, dietary_tags,
      collection_window_start, collection_window_end, expires_at, notes
    FROM donation_submissions
    WHERE id = ${submissionId} AND organization_id = ${organizationId} AND status = 'pending'
    LIMIT 1
  `;
  const submission = rows[0] as Record<string, unknown> | undefined;

  if (!submission) throw new Error("This submission is no longer available for review.");

  const donations = await sql()`
    INSERT INTO donations (
      organization_id, donor_name, collection_window_start, collection_window_end,
      expires_at, status, notes, created_by
    ) VALUES (
      ${organizationId}, ${String(submission.donor_name)},
      ${new Date(String(submission.collection_window_start))},
      ${new Date(String(submission.collection_window_end))},
      ${new Date(String(submission.expires_at))}, 'available',
      ${submission.notes ? String(submission.notes) : null}, ${userId}
    ) RETURNING id
  `;
  const donationId = String((donations[0] as Record<string, unknown>).id);

  await sql()`
    INSERT INTO donation_items (organization_id, donation_id, name, available_portions, dietary_tags)
    VALUES (${organizationId}, ${donationId}, ${String(submission.item_name)},
      ${Number(submission.portions)}, ${(submission.dietary_tags as string[]) ?? []})
  `;
  await sql()`
    UPDATE donation_submissions
    SET status = 'approved', reviewed_by = ${userId}, reviewed_at = now()
    WHERE id = ${submissionId} AND organization_id = ${organizationId}
  `;
  await sql()`
    INSERT INTO audit_events (organization_id, actor_user_id, action, entity_type, entity_id, payload)
    VALUES (${organizationId}, ${userId}, 'donation_submission_approved', 'donation', ${donationId},
      ${JSON.stringify({ submissionId })}::jsonb)
  `;

  return donationId;
}
