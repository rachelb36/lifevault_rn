import { normalizePetList } from "../pet.normalize";

describe("normalizePetList", () => {
  it("returns empty list for null/undefined", () => {
    expect(normalizePetList(null)).toEqual([]);
  });

  it("returns normalized data when current shape is present", () => {
    const input = [
      {
        schemaVersion: 1,
        id: "p1",
        petName: "Max",
        kind: "Dog",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    const pets = normalizePetList(input);
    expect(pets).toHaveLength(1);
    expect(pets[0].petName).toBe("Max");
  });

  it("filters out items without id", () => {
    const input = [
      { petName: "NoId", kind: "Cat" },
      { id: "p1", petName: "Valid", kind: "Dog", schemaVersion: 1, createdAt: "2024-01-01T00:00:00Z" },
    ];
    const pets = normalizePetList(input);
    expect(pets).toHaveLength(1);
    expect(pets[0].petName).toBe("Valid");
  });

  it("defaults missing kind to Other", () => {
    const input = [{ id: "p1", petName: "Max", schemaVersion: 1, createdAt: "2024-01-01T00:00:00Z" }];
    const pets = normalizePetList(input);
    expect(pets[0].kind).toBe("Other");
  });

  it("preserves updatedAt when already present", () => {
    const input = [
      {
        schemaVersion: 1,
        id: "p1",
        petName: "Max",
        kind: "Dog",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-06-15T12:00:00Z",
      },
    ];
    const pets = normalizePetList(input);
    expect(pets[0].updatedAt).toBe("2024-06-15T12:00:00Z");
  });
});
