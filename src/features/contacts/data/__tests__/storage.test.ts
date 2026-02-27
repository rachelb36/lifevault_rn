import AsyncStorage from "@react-native-async-storage/async-storage";
import { getContacts, saveContacts, upsertContact, deleteContact } from "../storage";

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe("getContacts", () => {
  it("returns empty array when no data", async () => {
    const result = await getContacts();
    expect(result).toEqual([]);
  });

  it("returns normalized contacts", async () => {
    const stored = [
      {
        id: "c1",
        firstName: "Jane",
        lastName: "Doe",
        phone: "555-0100",
        categories: ["Medical"],
        isFavorite: false,
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));

    const result = await getContacts();
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("Jane");
  });

  it("filters entries missing current-name fields", async () => {
    const stored = [{ id: "c1", name: "John Smith", phone: "555-0100" }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));
    const result = await getContacts();
    expect(result).toEqual([]);
  });

  it("defaults empty categories to Other", async () => {
    const stored = [
      { id: "c1", firstName: "Jane", lastName: "Doe", phone: "555-0100", categories: [] },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));

    const result = await getContacts();
    expect(result[0].categories).toEqual(["Other"]);
  });

  it("does not write during read normalization", async () => {
    const stored = [
      { id: "c1", firstName: "Jane", lastName: "Doe", phone: "555-0100", categories: ["Medical"], isFavorite: false },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(stored));
    await getContacts();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
