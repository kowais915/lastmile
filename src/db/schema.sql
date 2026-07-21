-- Last Mile's initial operational schema.
-- Apply this through the Neon migration workflow, never by manually editing production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE membership_role AS ENUM ('coordinator', 'partner_manager', 'volunteer');
CREATE TYPE donation_status AS ENUM ('draft', 'available', 'allocated', 'collected', 'expired', 'cancelled');
CREATE TYPE urgency_level AS ENUM ('routine', 'elevated', 'urgent', 'critical');
CREATE TYPE allocation_plan_status AS ENUM ('draft', 'confirmed', 'superseded', 'cancelled');
CREATE TYPE pickup_status AS ENUM ('unclaimed', 'claimed', 'collected', 'delivered', 'cancelled');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_organization_id text NOT NULL UNIQUE,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  role membership_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, clerk_user_id)
);

CREATE TABLE partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  contact_phone text,
  service_area text,
  travel_band smallint NOT NULL DEFAULT 0 CHECK (travel_band BETWEEN 0 AND 5),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE partner_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  requested_portions integer NOT NULL CHECK (requested_portions > 0),
  remaining_capacity integer NOT NULL CHECK (remaining_capacity >= 0),
  urgency urgency_level NOT NULL DEFAULT 'routine',
  dietary_tags text[] NOT NULL DEFAULT '{}',
  available_from timestamptz NOT NULL,
  available_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (available_until > available_from)
);

CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  collection_window_start timestamptz NOT NULL,
  collection_window_end timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status donation_status NOT NULL DEFAULT 'draft',
  notes text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (collection_window_end > collection_window_start),
  CHECK (expires_at >= collection_window_end)
);

CREATE TABLE donation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  name text NOT NULL,
  available_portions integer NOT NULL CHECK (available_portions >= 0),
  dietary_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE allocation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  status allocation_plan_status NOT NULL DEFAULT 'draft',
  input_snapshot jsonb NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  UNIQUE (donation_id, status) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE TABLE allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  allocation_plan_id uuid NOT NULL REFERENCES allocation_plans(id) ON DELETE CASCADE,
  donation_item_id uuid NOT NULL REFERENCES donation_items(id) ON DELETE RESTRICT,
  partner_need_id uuid NOT NULL REFERENCES partner_needs(id) ON DELETE RESTRICT,
  portions integer NOT NULL CHECK (portions > 0),
  score numeric(8, 2) NOT NULL,
  explanation jsonb NOT NULL,
  overridden_by text,
  override_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pickup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL UNIQUE REFERENCES allocations(id) ON DELETE CASCADE,
  status pickup_status NOT NULL DEFAULT 'unclaimed',
  volunteer_user_id text,
  claimed_at timestamptz,
  delivered_at timestamptz,
  delivery_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX partner_needs_organization_availability_idx
  ON partner_needs (organization_id, available_from, available_until);
CREATE INDEX donations_organization_status_expiry_idx
  ON donations (organization_id, status, expires_at);
CREATE INDEX audit_events_organization_entity_idx
  ON audit_events (organization_id, entity_type, entity_id, created_at DESC);

-- Public donor listings enter a coordinator review queue before becoming active donations.
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'declined');

CREATE TABLE donation_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  donor_phone text,
  item_name text NOT NULL,
  portions integer NOT NULL CHECK (portions > 0),
  dietary_tags text[] NOT NULL DEFAULT '{}',
  collection_window_start timestamptz NOT NULL,
  collection_window_end timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  notes text,
  status submission_status NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (collection_window_end > collection_window_start),
  CHECK (expires_at >= collection_window_end)
);

CREATE INDEX donation_submissions_review_idx
  ON donation_submissions (organization_id, status, expires_at);

-- Role assignment is explicit. Clerk owns the organization invitation; this
-- table owns the Last Mile role and, for partner managers, partner assignment.
CREATE TABLE member_role_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role membership_role NOT NULL CHECK (role IN ('partner_manager', 'volunteer')),
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  clerk_invitation_id text NOT NULL UNIQUE,
  created_by text NOT NULL,
  claimed_by text,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

ALTER TABLE memberships ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;

CREATE INDEX member_role_invitations_claim_idx
  ON member_role_invitations (organization_id, email)
  WHERE claimed_at IS NULL;
CREATE INDEX pickup_tasks_volunteer_status_idx
  ON pickup_tasks (organization_id, volunteer_user_id, status);
