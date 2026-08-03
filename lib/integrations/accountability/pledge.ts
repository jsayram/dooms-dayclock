import type {
  AccountabilityPaymentLink,
  AccountabilityPledge,
  PledgeAmountUsd,
  VoluntaryPledgeAcknowledgment,
} from "./types.ts";

export function validatePledgeAmount(value: unknown): PledgeAmountUsd {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 1 || value > 5) {
    throw new RangeError("Pledge amount must be a whole dollar amount from $1 to $5.");
  }
  return value as PledgeAmountUsd;
}

export function createVoluntaryAcknowledgment(
  accepted: boolean,
  acceptedAt: Date = new Date(),
): VoluntaryPledgeAcknowledgment {
  if (!accepted) {
    throw new TypeError("The voluntary pledge terms must be explicitly accepted.");
  }
  if (Number.isNaN(acceptedAt.getTime())) {
    throw new TypeError("Acknowledgment time must be valid.");
  }
  return Object.freeze({
    accepted: true,
    acceptedAtIso: acceptedAt.toISOString(),
    statementVersion: "voluntary-v1",
    understandsNoAutomaticCharge: true,
    understandsPaymentIsOptional: true,
  });
}

export function createAccountabilityPledge(input: {
  readonly amountUsd: unknown;
  readonly recipient: AccountabilityPaymentLink;
  readonly acknowledgment: VoluntaryPledgeAcknowledgment;
}): AccountabilityPledge {
  const acknowledgmentTime = Date.parse(input.acknowledgment.acceptedAtIso);
  if (
    input.acknowledgment.accepted !== true ||
    input.acknowledgment.statementVersion !== "voluntary-v1" ||
    input.acknowledgment.understandsNoAutomaticCharge !== true ||
    input.acknowledgment.understandsPaymentIsOptional !== true ||
    !Number.isFinite(acknowledgmentTime)
  ) {
    throw new TypeError("A voluntary acknowledgment is required.");
  }
  return Object.freeze({
    amountUsd: validatePledgeAmount(input.amountUsd),
    recipient: input.recipient,
    acknowledgment: input.acknowledgment,
  });
}
