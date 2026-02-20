import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type { DependentProfile, PersonProfile, PetProfile, Profile } from "@/features/profiles/domain/types";
import { listPets, upsertPet, deletePet } from "@/features/pets/data/petsStorage";

const KEY = "dependents_v1";

function parseList(raw?: string | null): DependentProfile[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DependentProfile[]) : [];
  } catch {
    return [];
  }
}

async function readAndMigrateDependents(): Promise<DependentProfile[]> {
  const asyncRaw = await AsyncStorage.getItem(KEY);
  const asyncList = parseList(asyncRaw);
  if (asyncList.length > 0) return asyncList;

  const legacyRaw = await SecureStore.getItemAsync(KEY);
  const legacyList = parseList(legacyRaw);
  if (legacyList.length > 0) {
    await AsyncStorage.setItem(KEY, JSON.stringify(legacyList));
  }
  return legacyList;
}

function nowIso() {
  return new Date().toISOString();
}

function personToProfile(person: DependentProfile): PersonProfile {
  return {
    id: person.id,
    profileType: "PERSON",
    firstName: person.firstName,
    lastName: person.lastName,
    preferredName: person.preferredName,
    relationship: person.relationship,
    dob: person.dob,
    avatarUri: person.avatar,
    isPrimary: person.isPrimary,
    createdAt: person.createdAt || nowIso(),
    updatedAt: person.updatedAt || nowIso(),
  };
}

function petToProfile(pet: any): PetProfile {
  return {
    id: String(pet.id),
    profileType: "PET",
    petName: String(pet.petName || ""),
    kind: String(pet.kind || "Other"),
    kindOtherText: pet.kindOtherText || undefined,
    breed: pet.breed || undefined,
    breedOtherText: pet.breedOtherText || undefined,
    dob: pet.dob || pet.dobOrAdoptionDate || undefined,
    adoptionDate: pet.adoptionDate || undefined,
    avatarUri: pet.avatar || undefined,
    microchipId: pet.microchipId || undefined,
    createdAt: String(pet.createdAt || nowIso()),
    updatedAt: String(pet.updatedAt || nowIso()),

    weightValue: pet.weightValue || undefined,
    weightUnit: pet.weightUnit || undefined,

    foodBrand: pet.foodBrand || undefined,
    foodType: pet.foodType || undefined,
    portionAmount: pet.portionAmount || undefined,
    portionUnit: pet.portionUnit || undefined,
    feedingTimes: Array.isArray(pet.feedingTimes) ? pet.feedingTimes : undefined,
    treatAllowed: pet.treatAllowed || undefined,
    treatRulesNotes: pet.treatRulesNotes || undefined,

    pottyTimesPerDay: pet.pottyTimesPerDay || undefined,
    pottyTimes: Array.isArray(pet.pottyTimes) ? pet.pottyTimes : undefined,
    leashHarnessNotes: pet.leashHarnessNotes || undefined,
    avoidTriggers: Array.isArray(pet.avoidTriggers) ? pet.avoidTriggers : undefined,
    avoidTriggersNotes: pet.avoidTriggersNotes || undefined,

    sleepLocation: pet.sleepLocation || undefined,
    crateRule: pet.crateRule || undefined,
    bedtimeRoutine: pet.bedtimeRoutine || undefined,

    fears: Array.isArray(pet.fears) ? pet.fears : undefined,
    separationAnxietyLevel: pet.separationAnxietyLevel || undefined,
    separationAnxietyNotes: pet.separationAnxietyNotes || undefined,

    medications: Array.isArray(pet.medications) ? pet.medications : undefined,
    vaccinations: Array.isArray(pet.vaccinations) ? pet.vaccinations : undefined,
  };
}

export async function getDependents(): Promise<DependentProfile[]> {
  return readAndMigrateDependents();
}

export async function saveDependents(list: DependentProfile[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function findDependent(depId: string): Promise<DependentProfile | null> {
  const list = await getDependents();
  return list.find((d) => d.id === depId) ?? null;
}

export async function updateDependent(
  depId: string,
  updater: (dep: DependentProfile) => DependentProfile
): Promise<void> {
  const list = await getDependents();
  const next = list.map((d) => (d.id === depId ? updater(d) : d));
  await saveDependents(next);
}

export async function upsertDependent(nextDependent: DependentProfile): Promise<void> {
  const list = await getDependents();
  const existingIndex = list.findIndex((d) => d.id === nextDependent.id);
  const normalized: DependentProfile = {
    ...nextDependent,
    avatar: nextDependent.avatar || nextDependent.avatarUri || "",
    hasCompletedProfile: nextDependent.hasCompletedProfile ?? true,
    createdAt: nextDependent.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  if (existingIndex === -1) {
    await saveDependents([normalized, ...list]);
    return;
  }

  const next = [...list];
  next[existingIndex] = { ...next[existingIndex], ...normalized };
  await saveDependents(next);
}

export async function deleteDependent(depId: string): Promise<void> {
  const list = await getDependents();
  await saveDependents(list.filter((d) => d.id !== depId));
}

// Compatibility helpers used across routes.
export async function listPeopleProfiles(): Promise<PersonProfile[]> {
  const people = await getDependents();
  return people.map(personToProfile);
}

export async function listPetProfiles(): Promise<PetProfile[]> {
  const pets = await listPets();
  return pets.map(petToProfile);
}

export async function getProfiles(): Promise<Profile[]> {
  const [people, pets] = await Promise.all([listPeopleProfiles(), listPetProfiles()]);
  return [...people, ...pets];
}

export async function findProfile(profileId: string): Promise<Profile | null> {
  const [person, pet] = await Promise.all([
    findDependent(profileId),
    listPets().then((all) => all.find((p) => p.id === profileId) ?? null),
  ]);

  if (person) return personToProfile(person);
  if (pet) return petToProfile(pet);
  return null;
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  if (profile.profileType === "PERSON") {
    await upsertDependent({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      preferredName: profile.preferredName,
      relationship: profile.relationship,
      dob: profile.dob,
      avatar: profile.avatarUri || "",
      isPrimary: profile.isPrimary,
      hasCompletedProfile: true,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      profileType: "PERSON",
      avatarUri: profile.avatarUri,
    } as DependentProfile);
    return profile;
  }

  await upsertPet({
    schemaVersion: 1,
    id: profile.id,
    petName: profile.petName,
    kind: profile.kind,
    kindOtherText: profile.kindOtherText,
    breed: profile.breed,
    breedOtherText: profile.breedOtherText,
    dob: profile.dob,
    adoptionDate: profile.adoptionDate,
    avatar: profile.avatarUri,
    microchipId: profile.microchipId,
    createdAt: profile.createdAt || nowIso(),
    updatedAt: nowIso(),

    weightValue: profile.weightValue,
    weightUnit: profile.weightUnit,

    foodBrand: profile.foodBrand,
    foodType: profile.foodType,
    portionAmount: profile.portionAmount,
    portionUnit: profile.portionUnit,
    feedingTimes: profile.feedingTimes,
    treatAllowed: profile.treatAllowed,
    treatRulesNotes: profile.treatRulesNotes,

    pottyTimesPerDay: profile.pottyTimesPerDay,
    pottyTimes: profile.pottyTimes,
    leashHarnessNotes: profile.leashHarnessNotes,
    avoidTriggers: profile.avoidTriggers,
    avoidTriggersNotes: profile.avoidTriggersNotes,

    sleepLocation: profile.sleepLocation,
    crateRule: profile.crateRule,
    bedtimeRoutine: profile.bedtimeRoutine,

    fears: profile.fears,
    separationAnxietyLevel: profile.separationAnxietyLevel,
    separationAnxietyNotes: profile.separationAnxietyNotes,

    medications: profile.medications,
    vaccinations: profile.vaccinations,
  });

  return profile;
}

export async function deleteProfile(profileId: string): Promise<void> {
  const dep = await findDependent(profileId);
  if (dep) {
    await deleteDependent(profileId);
    return;
  }

  await deletePet(profileId);
}

export async function getPrimaryPersonProfile(): Promise<PersonProfile | null> {
  const people = await listPeopleProfiles();
  return people.find((p) => p.isPrimary || p.relationship?.toLowerCase() === "self") ?? null;
}
