import AsyncStorage from "@react-native-async-storage/async-storage";
import { listPets, upsertPet, deletePet } from "../petsStorage";

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe("listPets", () => {
  it("returns empty array when no data", async () => {
    const result = await listPets();
    expect(result).toEqual([]);
  });

  it("returns normalized pets from storage", async () => {
    const stored = [
      {
        schemaVersion: 1,
        id: "p1",
        petName: "Max",
        kind: "Dog",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));

    const result = await listPets();
    expect(result).toHaveLength(1);
    expect(result[0].petName).toBe("Max");
  });

  it("does not write during list", async () => {
    const stored = [
      {
        schemaVersion: 1,
        id: "p1",
        petName: "Max",
        kind: "Dog",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));

    await listPets();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("ignores items missing required current fields", async () => {
    const invalid = [{ id: "p1", name: "Buddy", kind: "Dog" }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(invalid));

    const result = await listPets();
    expect(result).toEqual([]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

describe("upsertPet", () => {
  it("adds a new pet", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("[]");

    await upsertPet({
      schemaVersion: 1,
      id: "p1",
      petName: "Luna",
      kind: "Cat",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const saved = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1]);
    expect(saved[0].petName).toBe("Luna");
  });
});

describe("deletePet", () => {
  it("removes the pet by id", async () => {
    const stored = [
      { schemaVersion: 1, id: "p1", petName: "Max", kind: "Dog", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
      { schemaVersion: 1, id: "p2", petName: "Luna", kind: "Cat", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));

    await deletePet("p1");

    const saved = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls.at(-1)[1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("p2");
  });
});
