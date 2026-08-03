export type AccountabilityPaymentProvider = "buy-me-a-coffee";

export type PledgeAmountUsd = 1 | 2 | 3 | 4 | 5;

export interface AccountabilityPaymentLink {
  readonly provider: AccountabilityPaymentProvider;
  readonly url: string;
}

/**
 * Explicit confirmation required before a pledge may be activated. A pledge is
 * motivational only: it is not a debt, authorization, or recurring agreement.
 */
export interface VoluntaryPledgeAcknowledgment {
  readonly accepted: true;
  readonly acceptedAtIso: string;
  readonly statementVersion: "voluntary-v1";
  readonly understandsNoAutomaticCharge: true;
  readonly understandsPaymentIsOptional: true;
}

export interface AccountabilityPledge {
  readonly amountUsd: PledgeAmountUsd;
  readonly recipient: AccountabilityPaymentLink;
  readonly acknowledgment: VoluntaryPledgeAcknowledgment;
}

export type AccountabilityOutcome =
  | {
      readonly result: "completed";
      readonly paymentDue: false;
      readonly optionalTipAllowed: true;
      readonly message: "Goal completed. No payment is due; a tip is optional.";
    }
  | {
      readonly result: "missed";
      readonly paymentDue: false;
      readonly voluntaryHonorPaymentSuggested: true;
      readonly amountUsd: PledgeAmountUsd;
      readonly message: "Goal missed. The honor payment remains voluntary.";
    };
