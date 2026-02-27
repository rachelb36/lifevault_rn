import type { PersonProfile } from "@/features/people/domain/person.model";
import type { PetProfile } from "@/features/pets/domain/pet.model";
import type { HouseholdProfile } from "@/features/household/domain/household.model";
import type { Profile } from "@/features/profiles/domain/profile.model";

import { listPeople, getPersonById, upsertPerson, deletePerson } from "@/features/people/data/peopleStorage";
import type { PersonProfileV1 } from "@/features/people/domain/person.schema";
import { listPets, upsertPet, deletePet } from "@/features/pets/data/petsStorage";
import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";
import { listHouseholds, upsertHousehold, deleteHousehold } from "@/features/household/data/householdStorage";
import type { HouseholdProfileV1 } from "@/features/household/domain/household.schema";

import { isLocalOnly } from "@/shared/config/dataMode";
import { apolloClient } from "@/lib/apollo";
import {
  fetchPeopleProfiles as fetchPeopleFromServer,
  fetchPetProfiles as fetchPetsFromServer,
  fetchHouseholdProfiles as fetchHouseholdsFromServer,
  fetchAllProfiles as fetchAllFromServer,
  fetchProfileById as fetchProfileFromServer,
} from "@/lib/graphql/entities";

export { listPeople, getPersonById, upsertPerson, deletePerson } from "@/features/people/data/peopleStorage";

function nowIso() {
  return new Date().toISOString();
}

// ─── Local-mode mappers (AsyncStorage V1 → Profile) ─

function personToProfile(person: PersonProfileV1): PersonProfile {
  return {
    id: person.id,
    profileType: "PERSON",
    firstName: person.firstName,
    lastName: person.lastName,
    preferredName: person.preferredName,
    relationship: person.relationship,
    dob: person.dob,
    avatarUri: person.avatarUri,
    isPrimary: person.isPrimary,
    createdAt: person.createdAt || nowIso(),
    updatedAt: person.updatedAt || nowIso(),
  };
}

function petToProfile(pet: PetProfileV1): PetProfile {
  return {
    id: String(pet.id),
    profileType: "PET",
    petName: String(pet.petName || ""),
    kind: String(pet.kind || "Other"),
    kindOtherText: pet.kindOtherText || undefined,
    breed: pet.breed || undefined,
    breedOtherText: pet.breedOtherText || undefined,
    dob: pet.dob || undefined,
    dateType: pet.dateType || undefined,
    adoptionDate: pet.adoptionDate || undefined,
    gender: pet.gender || undefined,
    avatarUri: pet.avatarUri || undefined,
    createdAt: String(pet.createdAt || nowIso()),
    updatedAt: String(pet.updatedAt || nowIso()),
  };
}

function householdToProfile(household: HouseholdProfileV1): HouseholdProfile {
  return {
    id: household.id,
    profileType: "HOUSEHOLD",
    name: household.name,
    address: household.address || undefined,
    memberIds: household.memberIds || [],
    createdAt: household.createdAt || nowIso(),
    updatedAt: household.updatedAt || nowIso(),
  };
}

// ─── Read operations (branch: local vs server) ──────

export async function listPeopleProfiles(): Promise<PersonProfile[]> {
  if (await isLocalOnly()) {
    const people = await listPeople();
    return people.map(personToProfile);
  }
  return fetchPeopleFromServer(apolloClient);
}

export async function listPetProfiles(): Promise<PetProfile[]> {
  if (await isLocalOnly()) {
    const pets = await listPets();
    return pets.map(petToProfile);
  }
  return fetchPetsFromServer(apolloClient);
}

export async function listHouseholdProfiles(): Promise<HouseholdProfile[]> {
  if (await isLocalOnly()) {
    const households = await listHouseholds();
    return households.map(householdToProfile);
  }
  return fetchHouseholdsFromServer(apolloClient);
}

export async function getProfiles(): Promise<Profile[]> {
  if (await isLocalOnly()) {
    const [people, pets, households] = await Promise.all([
      listPeople().then((all) => all.map(personToProfile)),
      listPets().then((all) => all.map(petToProfile)),
      listHouseholds().then((all) => all.map(householdToProfile)),
    ]);
    return [...households, ...people, ...pets];
  }
  return fetchAllFromServer(apolloClient);
}

export async function getDefaultHousehold(): Promise<HouseholdProfile | null> {
  const households = await listHouseholdProfiles();
  return households[0] ?? null;
}

export async function findProfile(profileId: string): Promise<Profile | null> {
  if (await isLocalOnly()) {
    const [person, pet, household] = await Promise.all([
      getPersonById(profileId),
      listPets().then((all) => all.find((p) => p.id === profileId) ?? null),
      listHouseholds().then((all) => all.find((h) => h.id === profileId) ?? null),
    ]);

    if (person) return personToProfile(person);
    if (pet) return petToProfile(pet);
    if (household) return householdToProfile(household);
    return null;
  }
  return fetchProfileFromServer(apolloClient, profileId);
}

// ─── Local-only write helpers ────────────────────────

async function addMemberToDefaultHousehold(memberId: string): Promise<void> {
  // Only relevant in local mode; in server mode, vault membership is implicit.
  if (!(await isLocalOnly())) return;

  const allHouseholds = await listHouseholds();
  let household = allHouseholds[0];

  if (!household) {
    const householdName = "Home";

    household = {
      schemaVersion: 1,
      id: `household_${Date.now()}`,
      name: householdName,
      memberIds: [memberId],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await upsertHousehold(household);
    return;
  }

  if (!household.memberIds.includes(memberId)) {
    household.memberIds = [...household.memberIds, memberId];
    household.updatedAt = nowIso();
    await upsertHousehold(household);
  }
}

/**
 * Persist a profile to AsyncStorage.
 * In server mode, callers should use GraphQL mutations directly
 * and NOT call this function.
 */
export async function upsertProfile(profile: Profile): Promise<Profile> {
  if (profile.profileType === "PERSON") {
    await upsertPerson({
      schemaVersion: 1,
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      preferredName: profile.preferredName,
      relationship: profile.relationship,
      dob: profile.dob,
      avatarUri: profile.avatarUri,
      isPrimary: profile.isPrimary,
      createdAt: profile.createdAt || nowIso(),
      updatedAt: nowIso(),
    });
    await addMemberToDefaultHousehold(profile.id);
    return profile;
  }

  if (profile.profileType === "PET") {
    await upsertPet({
      schemaVersion: 1,
      id: profile.id,
      petName: profile.petName,
      kind: profile.kind,
      kindOtherText: profile.kindOtherText,
      breed: profile.breed,
      breedOtherText: profile.breedOtherText,
      dob: profile.dob,
      dateType: profile.dateType,
      adoptionDate: profile.adoptionDate,
      gender: profile.gender,
      avatarUri: profile.avatarUri,
      createdAt: profile.createdAt || nowIso(),
      updatedAt: nowIso(),
    });
    await addMemberToDefaultHousehold(profile.id);
    return profile;
  }

  // HOUSEHOLD
  await upsertHousehold({
    schemaVersion: 1,
    id: profile.id,
    name: profile.name,
    address: profile.address,
    memberIds: profile.memberIds,
    createdAt: profile.createdAt || nowIso(),
    updatedAt: nowIso(),
  });
  return profile;
}

export async function deleteProfile(profileId: string): Promise<void> {
  const person = await getPersonById(profileId);
  if (person) {
    await deletePerson(profileId);
    return;
  }

  const pet = await listPets().then((all) => all.find((p) => p.id === profileId));
  if (pet) {
    await deletePet(profileId);
    return;
  }

  await deleteHousehold(profileId);
}

export async function getPrimaryPersonProfile(): Promise<PersonProfile | null> {
  const people = await listPeopleProfiles();
  return people.find((p) => p.isPrimary || p.relationship?.toLowerCase() === "self") ?? null;
}
