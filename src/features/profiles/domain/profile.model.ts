import type { PersonProfile } from "@/features/people/domain/person.model";
import type { PetProfile } from "@/features/pets/domain/pet.model";

export type ProfileType = "PERSON" | "PET";
export type Profile = PersonProfile | PetProfile;

export type { PersonProfile, PetProfile };
