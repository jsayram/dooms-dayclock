import type {
  AccountabilityOutcome,
  AccountabilityPledge,
} from "./types.ts";

export function resolveAccountabilityOutcome(
  result: "completed" | "missed",
  pledge: AccountabilityPledge,
): AccountabilityOutcome {
  if (result === "completed") {
    return Object.freeze({
      result: "completed",
      paymentDue: false,
      optionalTipAllowed: true,
      message: "Goal completed. No payment is due; a tip is optional.",
    });
  }
  if (result === "missed") {
    return Object.freeze({
      result: "missed",
      paymentDue: false,
      voluntaryHonorPaymentSuggested: true,
      amountUsd: pledge.amountUsd,
      message: "Goal missed. The honor payment remains voluntary.",
    });
  }
  throw new TypeError("Accountability result must be completed or missed.");
}
