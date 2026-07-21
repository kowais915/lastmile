export type Urgency = "routine" | "elevated" | "urgent" | "critical";

export type DonationForAllocation = {
  id: string;
  availablePortions: number;
  expiresAt: Date;
  dietaryTags: string[];
};

export type PartnerNeedForAllocation = {
  id: string;
  requestedPortions: number;
  remainingCapacity: number;
  urgency: Urgency;
  dietaryTags: string[];
  availableFrom: Date;
  availableUntil: Date;
  travelBand: number;
  portionsReceivedRecently: number;
};

export type AllocationRecommendation = {
  partnerNeedId: string;
  portions: number;
  score: number;
  explanation: string[];
};

const urgencyPoints: Record<Urgency, number> = {
  routine: 10,
  elevated: 25,
  urgent: 45,
  critical: 65,
};

function hasDietaryFit(
  donationTags: string[],
  needTags: string[],
): boolean {
  return needTags.every((tag) => donationTags.includes(tag));
}

function expiryRisk(expiresAt: Date, now: Date): number {
  const hoursRemaining = Math.max(0, (expiresAt.getTime() - now.getTime()) / 3_600_000);

  if (hoursRemaining <= 2) return 60;
  if (hoursRemaining <= 6) return 40;
  if (hoursRemaining <= 12) return 25;
  return 10;
}

export function recommendAllocations(
  donation: DonationForAllocation,
  needs: PartnerNeedForAllocation[],
  now = new Date(),
): AllocationRecommendation[] {
  let remainingPortions = donation.availablePortions;

  const candidates = needs
    .filter(
      (need) =>
        need.remainingCapacity > 0 &&
        need.availableFrom <= donation.expiresAt &&
        need.availableUntil >= now &&
        hasDietaryFit(donation.dietaryTags, need.dietaryTags),
    )
    .map((need) => {
      const fairAccessBonus = Math.max(0, 30 - need.portionsReceivedRecently / 10);
      const score =
        expiryRisk(donation.expiresAt, now) +
        urgencyPoints[need.urgency] +
        20 +
        fairAccessBonus -
        need.travelBand * 8;

      return { need, score };
    })
    .sort((left, right) => right.score - left.score);

  return candidates.flatMap(({ need, score }) => {
    if (remainingPortions === 0) return [];

    const portions = Math.min(
      remainingPortions,
      need.requestedPortions,
      need.remainingCapacity,
    );
    remainingPortions -= portions;

    return [
      {
        partnerNeedId: need.id,
        portions,
        score,
        explanation: [
          `Urgency: ${need.urgency}.`,
          `Donation expires at ${donation.expiresAt.toLocaleTimeString()}.`,
          `Dietary requirements are compatible.`,
          need.portionsReceivedRecently === 0
            ? "This partner has not recently received food, increasing fair-access priority."
            : "Recent allocations were considered to preserve fair access.",
        ],
      },
    ];
  });
}
