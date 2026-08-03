import assert from "node:assert/strict";
import test from "node:test";

import {
  createAccountabilityPledge,
  createVoluntaryAcknowledgment,
  resolveAccountabilityOutcome,
  validateAccountabilityPaymentLink,
  validatePledgeAmount,
} from "../lib/integrations/accountability/index.ts";

test("accepts only strict Buy Me a Coffee creator links", () => {
  assert.deepEqual(
    validateAccountabilityPaymentLink("https://buymeacoffee.com/focus.friend"),
    {
      provider: "buy-me-a-coffee",
      url: "https://buymeacoffee.com/focus.friend",
    },
  );
  assert.throws(() =>
    validateAccountabilityPaymentLink("http://buymeacoffee.com/focus.friend"),
  );
  assert.throws(() =>
    validateAccountabilityPaymentLink("https://buymeacoffee.com.evil.test/focus.friend"),
  );
  assert.throws(() =>
    validateAccountabilityPaymentLink("https://buymeacoffee.com/focus.friend?email=user@example.com"),
  );
  assert.throws(() =>
    validateAccountabilityPaymentLink("https://buymeacoffee.com/focus/friend"),
  );
});

test("pledges allow only integer amounts from one to five dollars", () => {
  for (const amount of [1, 2, 3, 4, 5]) assert.equal(validatePledgeAmount(amount), amount);
  for (const amount of [0, 1.5, 6, "3", Number.NaN]) {
    assert.throws(() => validatePledgeAmount(amount));
  }
});

test("a pledge requires explicit voluntary acknowledgment", () => {
  assert.throws(() => createVoluntaryAcknowledgment(false));
  const acknowledgment = createVoluntaryAcknowledgment(
    true,
    new Date("2026-08-02T12:00:00.000Z"),
  );
  const recipient = validateAccountabilityPaymentLink(
    "https://buymeacoffee.com/focusfriend",
  );
  const pledge = createAccountabilityPledge({ amountUsd: 3, recipient, acknowledgment });
  assert.equal(pledge.amountUsd, 3);
  assert.equal(pledge.acknowledgment.understandsNoAutomaticCharge, true);
  assert.equal(pledge.acknowledgment.understandsPaymentIsOptional, true);
  assert.throws(() =>
    createAccountabilityPledge({
      amountUsd: 3,
      recipient,
      acknowledgment: { ...acknowledgment, understandsPaymentIsOptional: false },
    }),
  );
});

test("outcomes never claim a payment is due", () => {
  const pledge = createAccountabilityPledge({
    amountUsd: 4,
    recipient: validateAccountabilityPaymentLink(
      "https://buymeacoffee.com/focusfriend",
    ),
    acknowledgment: createVoluntaryAcknowledgment(true),
  });
  assert.deepEqual(resolveAccountabilityOutcome("completed", pledge), {
    result: "completed",
    paymentDue: false,
    optionalTipAllowed: true,
    message: "Goal completed. No payment is due; a tip is optional.",
  });
  assert.deepEqual(resolveAccountabilityOutcome("missed", pledge), {
    result: "missed",
    paymentDue: false,
    voluntaryHonorPaymentSuggested: true,
    amountUsd: 4,
    message: "Goal missed. The honor payment remains voluntary.",
  });
  assert.throws(() => resolveAccountabilityOutcome("charged", pledge));
});
