import { sheetSafe } from "@/lib/chat-log";
import { signReply, verifyReply } from "@/lib/chat-signing";
import { ageOn, cardsForReply, findRelevantActivities } from "@/lib/site-knowledge";
import { inferVisitorName } from "@/lib/visitor-name";
import { describe, expect, it } from "vitest";

describe("inferVisitorName", () => {
  it("accepts explicit introductions", () => {
    expect(inferVisitorName("I'm Rahul")).toBe("Rahul");
    expect(inferVisitorName("hi, my name is priya sharma.")).toBe("Priya Sharma");
  });

  it("does not treat questions or topics as names", () => {
    expect(inferVisitorName("python")).toBeNull();
    expect(inferVisitorName("phenocam")).toBeNull();
    expect(inferVisitorName("I am interested in his drone work")).toBeNull();
    expect(inferVisitorName("I am from Delhi")).toBeNull();
    expect(inferVisitorName("I'm a student")).toBeNull();
  });
});

describe("retrieval", () => {
  it("finds drone work across activities", () => {
    const slugs = findRelevantActivities("Which drones has he flown?").map((a) => a.slug);
    expect(slugs).toContain("ntpc-plantation-health-2025");
  });

  it("does not match stop words inside other words", () => {
    const slugs = findRelevantActivities("and his work").map((a) => a.slug);
    expect(slugs).not.toContain("ai-grand-challenge-2025");
  });

  it("uses the previous question for follow-ups", () => {
    const slugs = findRelevantActivities("and the prize?", "Tell me about AABTonics").map(
      (a) => a.slug,
    );
    expect(slugs).toContain("aabtonics-2022");
  });

  it("builds cards only for pages the reply links to", () => {
    const cards = cardsForReply(
      "He won it, see [AABTonics 2022](/activities/aabtonics-2022) and [skills](/skills).",
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].href).toBe("/activities/aabtonics-2022");
  });

  it("computes the age from the birthday", () => {
    expect(ageOn(new Date("2026-09-28T00:00:00Z"))).toBe(28);
    expect(ageOn(new Date("2027-04-29T00:00:00Z"))).toBe(28);
    expect(ageOn(new Date("2027-04-30T00:00:00Z"))).toBe(29);
  });
});

describe("chat safety", () => {
  it("stops chat messages from becoming spreadsheet formulas", () => {
    expect(sheetSafe("=IMPORTXML(A1)")).toBe("'=IMPORTXML(A1)");
    expect(sheetSafe("@mention")).toBe("'@mention");
    expect(sheetSafe("hello")).toBe("hello");
  });

  it("only trusts replies signed for the same conversation", () => {
    process.env.CHAT_SIGNING_SECRET = "test-secret";
    const signature = signReply("conversation-1", "A reply");
    expect(verifyReply("conversation-1", "A reply", signature)).toBe(true);
    expect(verifyReply("conversation-1", "An edited reply", signature)).toBe(false);
    expect(verifyReply("conversation-2", "A reply", signature)).toBe(false);
    expect(verifyReply("conversation-1", "A reply", undefined)).toBe(false);
  });
});
