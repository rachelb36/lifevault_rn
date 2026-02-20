import { deleteProfile } from "@/features/profiles/data/storage";

export const PROFILES_KEY = "profiles_v2";

export async function deletePersonLocal(personId: string) {
  await deleteProfile(personId);
}

export async function deletePetLocal(petId: string) {
  await deleteProfile(petId);
}
