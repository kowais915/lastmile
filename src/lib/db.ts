import "server-only";

import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/env";
import { recommendAllocations } from "@/lib/allocation";

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

export type MemberRole = "coordinator" | "partner_manager" | "volunteer";

type Membership = { role: MemberRole; partnerId: string | null };

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

export async function getMembership(organizationId: string, userId: string): Promise<Membership | null> {
  const rows = await sql()`
    SELECT role, partner_id FROM memberships
    WHERE organization_id = ${organizationId} AND clerk_user_id = ${userId}
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row
    ? { role: String(row.role) as MemberRole, partnerId: row.partner_id ? String(row.partner_id) : null }
    : null;
}

export async function getMembershipRole(organizationId: string, userId: string) {
  return (await getMembership(organizationId, userId))?.role ?? null;
}

export async function ensureWorkspaceMember(organizationId: string, userId: string, email?: string) {
  const existing = await getMembership(organizationId, userId);
  if (existing) return existing.role;

  const invitationRows = email
    ? await sql()`
        SELECT role, partner_id FROM member_role_invitations
        WHERE organization_id = ${organizationId} AND email = ${email.toLowerCase()} AND claimed_at IS NULL
        ORDER BY created_at DESC LIMIT 1
      `
    : [];
  const invitation = invitationRows[0] as Record<string, unknown> | undefined;
  const role = invitation ? String(invitation.role) as MemberRole : "volunteer";
  const partnerId = invitation?.partner_id ? String(invitation.partner_id) : null;

  await sql()`
    INSERT INTO memberships (organization_id, clerk_user_id, role, partner_id)
    VALUES (${organizationId}, ${userId}, ${role}, ${partnerId})
    ON CONFLICT (organization_id, clerk_user_id) DO NOTHING
  `;
  if (invitation) {
    await sql()`
      UPDATE member_role_invitations
      SET claimed_by = ${userId}, claimed_at = now()
      WHERE organization_id = ${organizationId} AND email = ${email!.toLowerCase()} AND claimed_at IS NULL
    `;
  }
  return role;
}

export async function getVolunteerTasks(organizationId: string, userId: string) {
  const rows = await sql()`
    SELECT task.id, task.status, task.delivery_note, task.volunteer_user_id,
      task.claimed_at, task.delivered_at, allocation.portions,
      partner.name AS partner_name, partner.service_area AS partner_service_area,
      (to_jsonb(partner) ->> 'latitude')::double precision AS partner_latitude,
      (to_jsonb(partner) ->> 'longitude')::double precision AS partner_longitude,
      donation.donor_name, donation.collection_window_start, donation.collection_window_end,
      donation.expires_at, item.name AS item_name, item.dietary_tags,
      (to_jsonb(donation) ->> 'pickup_latitude')::double precision AS pickup_latitude,
      (to_jsonb(donation) ->> 'pickup_longitude')::double precision AS pickup_longitude
    FROM pickup_tasks task
    JOIN allocations allocation ON allocation.id = task.allocation_id
    JOIN partner_needs need ON need.id = allocation.partner_need_id
    JOIN partners partner ON partner.id = need.partner_id
    JOIN allocation_plans plan ON plan.id = allocation.allocation_plan_id
    JOIN donations donation ON donation.id = plan.donation_id
    JOIN donation_items item ON item.id = allocation.donation_item_id
    WHERE task.organization_id = ${organizationId}
      AND (task.volunteer_user_id IS NULL OR task.volunteer_user_id = ${userId})
    ORDER BY CASE WHEN task.volunteer_user_id = ${userId} THEN 0 ELSE 1 END,
      donation.collection_window_end ASC, donation.expires_at ASC
  `;
  return rows.map((row) => ({
    id: String((row as Record<string, unknown>).id),
    status: String((row as Record<string, unknown>).status),
    deliveryNote: (row as Record<string, unknown>).delivery_note
      ? String((row as Record<string, unknown>).delivery_note)
      : null,
    volunteerUserId: (row as Record<string, unknown>).volunteer_user_id
      ? String((row as Record<string, unknown>).volunteer_user_id)
      : null,
    portions: Number((row as Record<string, unknown>).portions),
    partnerName: String((row as Record<string, unknown>).partner_name),
    partnerServiceArea: (row as Record<string, unknown>).partner_service_area
      ? String((row as Record<string, unknown>).partner_service_area)
      : null,
    partnerLatitude: (row as Record<string, unknown>).partner_latitude === null
      ? null
      : Number((row as Record<string, unknown>).partner_latitude),
    partnerLongitude: (row as Record<string, unknown>).partner_longitude === null
      ? null
      : Number((row as Record<string, unknown>).partner_longitude),
    donorName: String((row as Record<string, unknown>).donor_name),
    itemName: String((row as Record<string, unknown>).item_name),
    dietaryTags: ((row as Record<string, unknown>).dietary_tags as string[]) ?? [],
    collectionWindowStart: new Date(String((row as Record<string, unknown>).collection_window_start)).toISOString(),
    collectionWindowEnd: new Date(String((row as Record<string, unknown>).collection_window_end)).toISOString(),
    expiresAt: new Date(String((row as Record<string, unknown>).expires_at)).toISOString(),
    claimedAt: (row as Record<string, unknown>).claimed_at
      ? new Date(String((row as Record<string, unknown>).claimed_at)).toISOString()
      : null,
    deliveredAt: (row as Record<string, unknown>).delivered_at
      ? new Date(String((row as Record<string, unknown>).delivered_at)).toISOString()
      : null,
    pickupLatitude: (row as Record<string, unknown>).pickup_latitude === null
      ? null
      : Number((row as Record<string, unknown>).pickup_latitude),
    pickupLongitude: (row as Record<string, unknown>).pickup_longitude === null
      ? null
      : Number((row as Record<string, unknown>).pickup_longitude),
  }));
}

export async function claimVolunteerTask({ organizationId, userId, taskId }: { organizationId: string; userId: string; taskId: string }) {
  if (await getMembershipRole(organizationId, userId) !== "volunteer") throw new Error("Only volunteers can claim pickup tasks.");
  const rows = await sql()`
    UPDATE pickup_tasks SET status = 'claimed', volunteer_user_id = ${userId}, claimed_at = now(), updated_at = now()
    WHERE id = ${taskId} AND organization_id = ${organizationId}
      AND status = 'unclaimed' AND volunteer_user_id IS NULL
    RETURNING id
  `;
  if (!rows[0]) throw new Error("This pickup was just claimed by another volunteer.");
}

export async function advanceVolunteerTask({ organizationId, userId, taskId, nextStatus, deliveryNote }: {
  organizationId: string; userId: string; taskId: string; nextStatus: "collected" | "delivered"; deliveryNote?: string;
}) {
  if (await getMembershipRole(organizationId, userId) !== "volunteer") throw new Error("Only volunteers can update pickup tasks.");
  const expectedStatus = nextStatus === "collected" ? "claimed" : "collected";
  const note = deliveryNote?.trim() || null;
  if (note && note.length > 500) throw new Error("Keep the delivery note under 500 characters.");
  const rows = await sql()`
    UPDATE pickup_tasks
    SET status = ${nextStatus},
      delivery_note = CASE WHEN ${nextStatus} = 'delivered' THEN ${note} ELSE delivery_note END,
      delivered_at = CASE WHEN ${nextStatus} = 'delivered' THEN now() ELSE delivered_at END,
      updated_at = now()
    WHERE id = ${taskId} AND organization_id = ${organizationId}
      AND volunteer_user_id = ${userId} AND status = ${expectedStatus}
    RETURNING id
  `;
  if (!rows[0]) throw new Error("This handoff is no longer in the expected state.");
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

export async function seedStarterPartners(organizationId: string) {
  const countRows = await sql()`
    SELECT count(*)::int AS count FROM partners WHERE organization_id = ${organizationId}
  `;
  if (Number((countRows[0] as Record<string, unknown>).count) > 0) return;

  const now = new Date();
  const availableUntil = new Date(now.getTime() + 12 * 3_600_000);
  const starterPartners = [
    ["Harbor House", "Downtown", 1, 80, 100, "critical"],
    ["North Star Shelter", "Riverside", 2, 65, 70, "urgent"],
    ["Cedar Community Fridge", "East Market", 1, 45, 60, "elevated"],
  ] as const;

  for (const [name, area, travelBand, requested, capacity, urgency] of starterPartners) {
    const partners = await sql()`
      INSERT INTO partners (organization_id, name, service_area, travel_band)
      VALUES (${organizationId}, ${name}, ${area}, ${travelBand}) RETURNING id
    `;
    const partnerId = String((partners[0] as Record<string, unknown>).id);
    await sql()`
      INSERT INTO partner_needs (
        organization_id, partner_id, requested_portions, remaining_capacity,
        urgency, dietary_tags, available_from, available_until
      ) VALUES (
        ${organizationId}, ${partnerId}, ${requested}, ${capacity},
        ${urgency}, ${["vegan"]}, ${now}, ${availableUntil}
      )
    `;
  }
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

export async function getPartners(organizationId: string) {
  const rows = await sql()`
    SELECT id, name, service_area, active FROM partners
    WHERE organization_id = ${organizationId} ORDER BY name ASC
  `;
  return rows.map((row) => {
    const partner = row as Record<string, unknown>;
    return {
      id: String(partner.id), name: String(partner.name),
      serviceArea: partner.service_area ? String(partner.service_area) : null,
      active: Boolean(partner.active),
    };
  });
}

export async function getTeamOverview(organizationId: string) {
  const [members, invites] = await Promise.all([
    sql()`SELECT m.clerk_user_id, m.role, p.name AS partner_name
      FROM memberships m LEFT JOIN partners p ON p.id = m.partner_id
      WHERE m.organization_id = ${organizationId} ORDER BY m.created_at ASC`,
    sql()`SELECT i.email, i.role, p.name AS partner_name, i.created_at
      FROM member_role_invitations i LEFT JOIN partners p ON p.id = i.partner_id
      WHERE i.organization_id = ${organizationId} AND i.claimed_at IS NULL ORDER BY i.created_at DESC`,
  ]);
  return {
    members: members.map((row) => {
      const member = row as Record<string, unknown>;
      return { userId: String(member.clerk_user_id), role: String(member.role) as MemberRole, partnerName: member.partner_name ? String(member.partner_name) : null };
    }),
    invites: invites.map((row) => {
      const invite = row as Record<string, unknown>;
      return { email: String(invite.email), role: String(invite.role) as MemberRole, partnerName: invite.partner_name ? String(invite.partner_name) : null, createdAt: new Date(String(invite.created_at)).toISOString() };
    }),
  };
}

export async function recordMemberInvitation({
  organizationId, email, role, partnerId, clerkInvitationId, createdBy,
}: {
  organizationId: string; email: string; role: Exclude<MemberRole, "coordinator">; partnerId: string | null; clerkInvitationId: string; createdBy: string;
}) {
  if (role === "partner_manager" && !partnerId) throw new Error("Choose the partner this manager will represent.");
  if (partnerId) {
    const valid = await sql()`SELECT id FROM partners WHERE id = ${partnerId} AND organization_id = ${organizationId} LIMIT 1`;
    if (!valid[0]) throw new Error("That partner does not belong to this workspace.");
  }
  await sql()`
    INSERT INTO member_role_invitations (organization_id, email, role, partner_id, clerk_invitation_id, created_by)
    VALUES (${organizationId}, ${email.toLowerCase()}, ${role}, ${partnerId}, ${clerkInvitationId}, ${createdBy})
    ON CONFLICT (organization_id, email) DO UPDATE SET
      role = EXCLUDED.role, partner_id = EXCLUDED.partner_id, clerk_invitation_id = EXCLUDED.clerk_invitation_id,
      created_by = EXCLUDED.created_by, claimed_by = NULL, claimed_at = NULL, created_at = now()
  `;
}

export async function getManagedPartner(organizationId: string, userId: string) {
  const rows = await sql()`
    SELECT p.id, p.name, p.service_area, n.id AS need_id, n.requested_portions,
      n.remaining_capacity, n.urgency, n.dietary_tags, n.available_from, n.available_until
    FROM memberships m
    JOIN partners p ON p.id = m.partner_id
    LEFT JOIN LATERAL (
      SELECT * FROM partner_needs WHERE partner_id = p.id AND organization_id = ${organizationId}
      ORDER BY updated_at DESC LIMIT 1
    ) n ON true
    WHERE m.organization_id = ${organizationId} AND m.clerk_user_id = ${userId} AND m.role = 'partner_manager'
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id), name: String(row.name), serviceArea: row.service_area ? String(row.service_area) : null,
    need: row.need_id ? {
      requestedPortions: Number(row.requested_portions), remainingCapacity: Number(row.remaining_capacity),
      urgency: String(row.urgency), dietaryTags: (row.dietary_tags as string[]) ?? [],
      availableFrom: new Date(String(row.available_from)).toISOString(), availableUntil: new Date(String(row.available_until)).toISOString(),
    } : null,
  };
}

export async function updateManagedPartnerNeed({ organizationId, userId, requestedPortions, remainingCapacity, urgency, dietaryTags, availableUntil }: {
  organizationId: string; userId: string; requestedPortions: number; remainingCapacity: number; urgency: "routine" | "elevated" | "urgent" | "critical"; dietaryTags: string[]; availableUntil: Date;
}) {
  const partner = await getManagedPartner(organizationId, userId);
  if (!partner) throw new Error("No partner is assigned to this account.");
  if (requestedPortions < 1 || remainingCapacity < 0 || availableUntil <= new Date()) throw new Error("Enter a valid current need and availability window.");
  await sql()`
    INSERT INTO partner_needs (organization_id, partner_id, requested_portions, remaining_capacity, urgency, dietary_tags, available_from, available_until)
    VALUES (${organizationId}, ${partner.id}, ${requestedPortions}, ${remainingCapacity}, ${urgency}, ${dietaryTags}, now(), ${availableUntil})
  `;
}

export async function getCoordinatorDashboard(organizationId: string) {
  const [draftPlans, tasks, mapRoutes, pendingSubmissions] = await Promise.all([
    sql()`SELECT plan.id, donation.donor_name, donation.expires_at, item.name AS item_name, item.available_portions,
      COALESCE(jsonb_agg(jsonb_build_object('partner', partner.name, 'portions', allocation.portions, 'score', allocation.score, 'reason', allocation.explanation) ORDER BY allocation.score DESC)
        FILTER (WHERE allocation.id IS NOT NULL), '[]'::jsonb) AS allocations
      FROM allocation_plans plan
      JOIN donations donation ON donation.id = plan.donation_id
      JOIN donation_items item ON item.donation_id = donation.id
      LEFT JOIN allocations allocation ON allocation.allocation_plan_id = plan.id AND allocation.donation_item_id = item.id
      LEFT JOIN partner_needs need ON need.id = allocation.partner_need_id
      LEFT JOIN partners partner ON partner.id = need.partner_id
      WHERE plan.organization_id = ${organizationId} AND plan.status = 'draft'
      GROUP BY plan.id, donation.donor_name, donation.expires_at, item.name, item.available_portions
      ORDER BY donation.expires_at ASC`,
    sql()`SELECT task.status, count(*)::int AS count FROM pickup_tasks task
      WHERE task.organization_id = ${organizationId} GROUP BY task.status`,
    sql()`SELECT task.id, task.status, allocation.portions, item.name AS item_name,
      donation.donor_name, partner.name AS partner_name, partner.service_area AS partner_service_area,
      (to_jsonb(donation) ->> 'pickup_latitude')::double precision AS pickup_latitude,
      (to_jsonb(donation) ->> 'pickup_longitude')::double precision AS pickup_longitude,
      (to_jsonb(partner) ->> 'latitude')::double precision AS partner_latitude,
      (to_jsonb(partner) ->> 'longitude')::double precision AS partner_longitude
      FROM pickup_tasks task
      JOIN allocations allocation ON allocation.id = task.allocation_id
      JOIN allocation_plans plan ON plan.id = allocation.allocation_plan_id
      JOIN donations donation ON donation.id = plan.donation_id
      JOIN donation_items item ON item.id = allocation.donation_item_id
      JOIN partner_needs need ON need.id = allocation.partner_need_id
      JOIN partners partner ON partner.id = need.partner_id
      WHERE task.organization_id = ${organizationId} AND task.status <> 'delivered'
      ORDER BY donation.collection_window_end ASC
      LIMIT 80`,
    sql()`SELECT id, donor_name, item_name, portions, expires_at, collection_window_end,
      count(*) OVER ()::int AS total_pending
      FROM donation_submissions
      WHERE organization_id = ${organizationId} AND status = 'pending'
      ORDER BY expires_at ASC
      LIMIT 3`,
  ]);
  return {
    draftPlans: draftPlans.map((row) => {
      const plan = row as Record<string, unknown>;
      return { id: String(plan.id), donorName: String(plan.donor_name), expiresAt: new Date(String(plan.expires_at)).toISOString(), itemName: String(plan.item_name), availablePortions: Number(plan.available_portions), allocations: (plan.allocations as Array<{ partner: string; portions: number; score: number; reason: string[] }>) ?? [] };
    }),
    taskCounts: Object.fromEntries(tasks.map((row) => [String((row as Record<string, unknown>).status), Number((row as Record<string, unknown>).count)])),
    mapRoutes: mapRoutes.map((row) => {
      const route = row as Record<string, unknown>;
      return {
        id: String(route.id), status: String(route.status), itemName: String(route.item_name), portions: Number(route.portions),
        pickup: { name: String(route.donor_name), latitude: route.pickup_latitude === null ? null : Number(route.pickup_latitude), longitude: route.pickup_longitude === null ? null : Number(route.pickup_longitude) },
        destination: { name: String(route.partner_name), detail: route.partner_service_area ? String(route.partner_service_area) : null, latitude: route.partner_latitude === null ? null : Number(route.partner_latitude), longitude: route.partner_longitude === null ? null : Number(route.partner_longitude) },
      };
    }),
    pendingSubmissionCount: pendingSubmissions[0]
      ? Number((pendingSubmissions[0] as Record<string, unknown>).total_pending)
      : 0,
    pendingSubmissions: pendingSubmissions.map((row) => {
      const submission = row as Record<string, unknown>;
      return {
        id: String(submission.id), donorName: String(submission.donor_name), itemName: String(submission.item_name),
        portions: Number(submission.portions), expiresAt: new Date(String(submission.expires_at)).toISOString(),
        collectionWindowEnd: new Date(String(submission.collection_window_end)).toISOString(),
      };
    }),
  };
}

export async function getOperationsIntelligence(organizationId: string) {
  const [impactRows, signalRows, capacityRows] = await Promise.all([
    sql()`WITH task_metrics AS (
      SELECT
        COALESCE(SUM(allocation.portions) FILTER (WHERE task.status = 'delivered'), 0)::int AS meals_rescued,
        COALESCE(SUM(allocation.portions) FILTER (WHERE task.status = 'delivered' AND task.delivered_at <= donation.expires_at), 0)::int AS meals_saved_before_expiry,
        COUNT(*) FILTER (WHERE task.status = 'delivered')::int AS delivered_handoffs,
        COUNT(*) FILTER (WHERE task.status = 'delivered' AND task.delivered_at <= donation.expires_at)::int AS on_time_handoffs,
        COUNT(*) FILTER (WHERE task.status <> 'cancelled')::int AS total_handoffs,
        COUNT(*) FILTER (WHERE task.status IN ('claimed', 'collected'))::int AS active_handoffs,
        COUNT(DISTINCT task.volunteer_user_id) FILTER (WHERE task.status IN ('claimed', 'collected', 'delivered'))::int AS active_volunteers
      FROM pickup_tasks task
      JOIN allocations allocation ON allocation.id = task.allocation_id
      JOIN allocation_plans plan ON plan.id = allocation.allocation_plan_id
      JOIN donations donation ON donation.id = plan.donation_id
      WHERE task.organization_id = ${organizationId}
    ), dispatch_metrics AS (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (plan.confirmed_at - donation.created_at)) / 60))::int AS average_dispatch_minutes
      FROM allocation_plans plan
      JOIN donations donation ON donation.id = plan.donation_id
      WHERE plan.organization_id = ${organizationId} AND plan.status = 'confirmed' AND plan.confirmed_at IS NOT NULL
    )
    SELECT task_metrics.*, dispatch_metrics.average_dispatch_minutes
    FROM task_metrics CROSS JOIN dispatch_metrics`,
    sql()`WITH signals AS (
      SELECT 'critical'::text AS severity, 'Review an expiring donation'::text AS title,
        donation.item_name || ' from ' || donation.donor_name || ' needs review before it expires.' AS detail,
        donation.expires_at AS due_at, '/review'::text AS href
      FROM donation_submissions donation
      WHERE donation.organization_id = ${organizationId} AND donation.status = 'pending'
        AND donation.expires_at <= now() + interval '24 hours'
      UNION ALL
      SELECT 'urgent'::text AS severity, 'Confirm a ready allocation'::text AS title,
        item.name || ' from ' || donation.donor_name || ' has a draft plan waiting for dispatch.' AS detail,
        donation.expires_at AS due_at, '/coordinator'::text AS href
      FROM allocation_plans plan
      JOIN donations donation ON donation.id = plan.donation_id
      JOIN donation_items item ON item.donation_id = donation.id
      WHERE plan.organization_id = ${organizationId} AND plan.status = 'draft'
        AND donation.expires_at <= now() + interval '12 hours'
      UNION ALL
      SELECT 'urgent'::text AS severity, 'Find a volunteer for pickup'::text AS title,
        item.name || ' is still unclaimed; collection closes soon.' AS detail,
        donation.collection_window_end AS due_at, '/volunteer'::text AS href
      FROM pickup_tasks task
      JOIN allocations allocation ON allocation.id = task.allocation_id
      JOIN allocation_plans plan ON plan.id = allocation.allocation_plan_id
      JOIN donations donation ON donation.id = plan.donation_id
      JOIN donation_items item ON item.id = allocation.donation_item_id
      WHERE task.organization_id = ${organizationId} AND task.status = 'unclaimed'
        AND donation.collection_window_end <= now() + interval '2 hours'
      UNION ALL
      SELECT 'elevated'::text AS severity, 'Check an in-progress handoff'::text AS title,
        item.name || ' has not been updated recently.' AS detail,
        task.updated_at AS due_at, '/volunteer'::text AS href
      FROM pickup_tasks task
      JOIN allocations allocation ON allocation.id = task.allocation_id
      JOIN allocation_plans plan ON plan.id = allocation.allocation_plan_id
      JOIN donations donation ON donation.id = plan.donation_id
      JOIN donation_items item ON item.id = allocation.donation_item_id
      WHERE task.organization_id = ${organizationId} AND task.status IN ('claimed', 'collected')
        AND task.updated_at <= now() - interval '90 minutes'
    )
    SELECT severity, title, detail, due_at, href FROM signals
    ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END, due_at ASC
    LIMIT 6`,
    sql()`SELECT partner.name, need.requested_portions, need.remaining_capacity, need.urgency, need.available_until
      FROM partners partner
      JOIN LATERAL (
        SELECT requested_portions, remaining_capacity, urgency, available_until
        FROM partner_needs
        WHERE partner_id = partner.id AND organization_id = ${organizationId}
        ORDER BY updated_at DESC
        LIMIT 1
      ) need ON true
      WHERE partner.organization_id = ${organizationId} AND partner.active = true
      ORDER BY (need.remaining_capacity::numeric / NULLIF(need.requested_portions, 0)) ASC, need.available_until ASC
      LIMIT 5`,
  ]);

  const impact = (impactRows[0] ?? {}) as Record<string, unknown>;
  const deliveredHandoffs = Number(impact.delivered_handoffs ?? 0);

  return {
    metrics: {
      mealsRescued: Number(impact.meals_rescued ?? 0),
      mealsSavedBeforeExpiry: Number(impact.meals_saved_before_expiry ?? 0),
      activeHandoffs: Number(impact.active_handoffs ?? 0),
      activeVolunteers: Number(impact.active_volunteers ?? 0),
      averageDispatchMinutes: impact.average_dispatch_minutes === null ? null : Number(impact.average_dispatch_minutes),
      onTimeDeliveryRate: deliveredHandoffs ? Math.round((Number(impact.on_time_handoffs ?? 0) / deliveredHandoffs) * 100) : null,
    },
    signals: signalRows.map((row) => {
      const signal = row as Record<string, unknown>;
      return {
        severity: String(signal.severity) as "critical" | "urgent" | "elevated",
        title: String(signal.title), detail: String(signal.detail), href: String(signal.href),
        dueAt: new Date(String(signal.due_at)).toISOString(),
      };
    }),
    partnerCapacity: capacityRows.map((row) => {
      const capacity = row as Record<string, unknown>;
      return {
        name: String(capacity.name), requestedPortions: Number(capacity.requested_portions),
        remainingCapacity: Number(capacity.remaining_capacity), urgency: String(capacity.urgency),
        availableUntil: new Date(String(capacity.available_until)).toISOString(),
      };
    }),
  };
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
  const role = await getMembershipRole(organizationId, userId);
  if (role !== "coordinator") throw new Error("Only coordinators can approve donations.");
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

  const items = await sql()`
    INSERT INTO donation_items (organization_id, donation_id, name, available_portions, dietary_tags)
    VALUES (${organizationId}, ${donationId}, ${String(submission.item_name)},
      ${Number(submission.portions)}, ${(submission.dietary_tags as string[]) ?? []}) RETURNING id
  `;
  const donationItemId = String((items[0] as Record<string, unknown>).id);
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

  const needs = await sql()`
    SELECT n.id, n.requested_portions, n.remaining_capacity, n.urgency,
      n.dietary_tags, n.available_from, n.available_until, p.travel_band
    FROM partner_needs n
    JOIN partners p ON p.id = n.partner_id
    WHERE n.organization_id = ${organizationId} AND p.active = true
  `;
  const recommendation = recommendAllocations(
    {
      id: donationItemId,
      availablePortions: Number(submission.portions),
      expiresAt: new Date(String(submission.expires_at)),
      dietaryTags: (submission.dietary_tags as string[]) ?? [],
    },
    needs.map((row) => {
      const need = row as Record<string, unknown>;
      return {
        id: String(need.id),
        requestedPortions: Number(need.requested_portions),
        remainingCapacity: Number(need.remaining_capacity),
        urgency: String(need.urgency) as "routine" | "elevated" | "urgent" | "critical",
        dietaryTags: (need.dietary_tags as string[]) ?? [],
        availableFrom: new Date(String(need.available_from)),
        availableUntil: new Date(String(need.available_until)),
        travelBand: Number(need.travel_band),
        portionsReceivedRecently: 0,
      };
    }),
  );

  const plans = await sql()`
    INSERT INTO allocation_plans (organization_id, donation_id, status, input_snapshot, created_by)
    VALUES (${organizationId}, ${donationId}, 'draft',
      ${JSON.stringify({ generatedFrom: "donation_submission", submissionId, recommendationCount: recommendation.length })}::jsonb,
      ${userId}) RETURNING id
  `;
  const planId = String((plans[0] as Record<string, unknown>).id);
  for (const item of recommendation) {
    await sql()`
      INSERT INTO allocations (organization_id, allocation_plan_id, donation_item_id, partner_need_id, portions, score, explanation)
      VALUES (${organizationId}, ${planId}, ${donationItemId}, ${item.partnerNeedId},
        ${item.portions}, ${item.score}, ${JSON.stringify(item.explanation)}::jsonb)
    `;
  }

  return planId;
}

export async function confirmAllocationPlan({ organizationId, userId, planId }: { organizationId: string; userId: string; planId: string }) {
  if (await getMembershipRole(organizationId, userId) !== "coordinator") throw new Error("Only coordinators can dispatch plans.");
  const plans = await sql()`
    UPDATE allocation_plans SET status = 'confirmed', confirmed_at = now()
    WHERE id = ${planId} AND organization_id = ${organizationId} AND status = 'draft'
    RETURNING donation_id
  `;
  const plan = plans[0] as Record<string, unknown> | undefined;
  if (!plan) throw new Error("This plan has already been dispatched or is unavailable.");
  const donationId = String(plan.donation_id);
  await sql()`
    INSERT INTO pickup_tasks (organization_id, allocation_id)
    SELECT ${organizationId}, allocation.id FROM allocations allocation
    WHERE allocation.allocation_plan_id = ${planId}
    ON CONFLICT (allocation_id) DO NOTHING
  `;
  await sql()`
    UPDATE donations SET status = 'allocated', updated_at = now()
    WHERE id = ${donationId} AND organization_id = ${organizationId}
  `;
}
