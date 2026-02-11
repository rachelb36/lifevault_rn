import * as SecureStore from "expo-secure-store";

const LOCAL_ONLY_KEY = "localOnlyMode";
const LOCAL_AUTH_KEY = "localAuth";
const LOCAL_USER_KEY = "localUser";

type LocalUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  hasOnboarded?: boolean;
};

type LocalAuth = {
  email: string;
  password: string;
};

export async function getLocalOnlyMode(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(LOCAL_ONLY_KEY);
  if (stored === null) {
    const envDefault = (process.env.EXPO_PUBLIC_LOCAL_ONLY || "").toLowerCase() === "true";
    await SecureStore.setItemAsync(LOCAL_ONLY_KEY, envDefault ? "true" : "false");
    return envDefault;
  }
  return stored === "true";
}

export async function setLocalOnlyMode(value: boolean): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_ONLY_KEY, value ? "true" : "false");
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const raw = await SecureStore.getItemAsync(LOCAL_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export async function setLocalUser(user: LocalUser): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_USER_KEY, JSON.stringify(user));
}

export async function getLocalAuth(): Promise<LocalAuth | null> {
  const raw = await SecureStore.getItemAsync(LOCAL_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalAuth;
  } catch {
    return null;
  }
}

export async function setLocalAuth(auth: LocalAuth): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_AUTH_KEY, JSON.stringify(auth));
}

export async function seedLocalData(): Promise<void> {
  const user: LocalUser = {
    id: `local-${Date.now()}`,
    email: "demo@lifevault.app",
    firstName: "Alex",
    lastName: "Morgan",
    preferredName: "Alex",
    hasOnboarded: true,
  };

  await setLocalUser(user);
  await setLocalAuth({ email: user.email, password: "demo1234" });
  await SecureStore.setItemAsync("accessToken", "local");
  await SecureStore.setItemAsync("userProfileCreated", "true");
  await SecureStore.setItemAsync("primaryProfileCreated", "true");

  const dependents = [
    {
      id: `dep-${Date.now()}`,
      firstName: "Jamie",
      lastName: "Morgan",
      preferredName: "Jamie",
      relationship: "Child",
      dob: "2014-06-20",
      avatar: "",
      isPrimary: false,
    },
  ];

  const pets = [
    {
      id: `pet-${Date.now()}`,
      petName: "Max",
      kind: "Dog",
      dob: "2019-03-12",
      breed: "Labrador",
      avatar: "",
    },
  ];

  await SecureStore.setItemAsync("dependents_v1", JSON.stringify(dependents));
  await SecureStore.setItemAsync("pets_v1", JSON.stringify(pets));
}
