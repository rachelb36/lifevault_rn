import type { PersonProfile } from "@/features/people/domain/person.model";
import type { PetProfile } from "@/features/pets/domain/pet.model";
import type { HouseholdProfile } from "@/features/household/domain/household.model";

export type ProfileType = "PERSON" | "PET" | "HOUSEHOLD";
export type Profile = PersonProfile | PetProfile | HouseholdProfile;

export type { PersonProfile, PetProfile, HouseholdProfile };
