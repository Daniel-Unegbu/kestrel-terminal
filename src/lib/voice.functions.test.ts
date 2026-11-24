import { describe, expect, it } from "vitest";
import { firstSentence } from "./voice.functions";

describe("AuditDesk voice response", () => {
  it("limits the spoken and displayed response to its first sentence", () => {
    expect(firstSentence("Review access controls first. Then test the audit trail.")).toBe(
      "Review access controls first.",
    );
  });
});
