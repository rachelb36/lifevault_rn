import type { PersonProfile } from "@/features/people/domain/person.model";
import type { PetProfile } from "@/features/pets/domain/pet.model";
import type { Profile } from "@/features/profiles/domain/profile.model";

import { listPeople, getPersonById, upsertPerson, deletePerson } from "@/features/people/data/peopleStorage";
import type { PersonProfileV1 } from "@/features/people/domain/person.schema";
import { listPets, upsertPet, deletePet } from "@/features/pets/data/petsStorage";
import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";

export { listPeople, getPersonById, upsertPerson, deletePerson } from "@/features/people/data/peopleStorage";

function nowIso() {
  return new Date().toISOString();
}

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
    gender: pet.gender || undefined,
    avatarUri: pet.avatarUri || undefined,
    createdAt: String(pet.createdAt || nowIso()),
    updatedAt: String(pet.updatedAt || nowIso()),
  };
}

export async function listPeopleProfiles(): Promise<PersonProfile[]> {
  const people = await listPeople();
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
    getPersonById(profileId),
    listPets().then((all) => all.find((p) => p.id === profileId) ?? null),
  ]);

  if (person) return personToProfile(person);
  if (pet) return petToProfile(pet);
  return null;
}

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
    gender: profile.gender,
    avatarUri: profile.avatarUri,
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
  await deletePet(profileId);
}

export async function getPrimaryPersonProfile(): Promise<PersonProfile | null> {
  const people = await listPeopleProfiles();
  return people.find((p) => p.isPrimary || p.relationship?.toLowerCase() === "self") ?? null;
}
