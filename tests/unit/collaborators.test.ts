import { parseCollaborators, splitCollaborators } from "@/lib/collaborators";
import { describe, expect, it } from "vitest";

describe("splitCollaborators", () => {
  it("handles an Oxford comma", () => {
    expect(
      splitCollaborators(
        "my supervisor - Prof. Siddhartha Khare, Madhulika Singh, and Geospatial Engineering Group, IITR",
      ),
    ).toEqual([
      "my supervisor - Prof. Siddhartha Khare",
      "Madhulika Singh",
      "Geospatial Engineering Group, IITR",
    ]);
  });

  it("keeps an institute acronym with the name before it", () => {
    expect(splitCollaborators("Colleagues from Geospatial, IITR")).toEqual([
      "Colleagues from Geospatial, IITR",
    ]);
  });

  it("splits on and and &", () => {
    expect(splitCollaborators("Suyash Khare & Gaurav Singh Bareth")).toEqual([
      "Suyash Khare",
      "Gaurav Singh Bareth",
    ]);
    expect(splitCollaborators("Prof. X and Y.")).toEqual(["Prof. X", "Y"]);
  });
});

describe("parseCollaborators", () => {
  it("finds verified profiles through honorifics and name variants", () => {
    const people = parseCollaborators(
      "Prof. Vivek Kumar Malik, Sivani, Peeyush and Akash A.",
    );
    expect(people.every((person) => person.kind === "person" && person.verified)).toBe(
      true,
    );
  });

  it("does not turn a group description into a person", () => {
    const [group] = parseCollaborators("Colleagues from the Geospatial Engineering Group, IITR");
    // A known LinkedIn page wins; otherwise it would be a plain group.
    expect(group.kind === "group" || group.kind === "person").toBe(true);
    expect(parseCollaborators("IN-SPACe organizers")[0].kind).toBe("group");
  });

  it("searches LinkedIn for unknown people without guessing their institute", () => {
    const [person] = parseCollaborators("Dr. Jane Doe");
    expect(person.kind).toBe("person");
    if (person.kind !== "person") return;
    expect(person.verified).toBe(false);
    expect(person.href).toContain("keywords=Jane%20Doe");
    expect(person.href).not.toContain("Roorkee");
  });

  it("keeps the supervisor role separate from the name", () => {
    const [person] = parseCollaborators("my supervisor - Prof. Siddhartha Khare");
    expect(person).toMatchObject({ kind: "person", role: "my supervisor", verified: true });
  });
});
