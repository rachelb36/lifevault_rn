import type { PersonProfile, PetProfile, PetMedication, PetVaccination, PetWeightUnit, Profile, ProfileType } from "@/features/profiles/domain/profile.model";

export type { PersonProfile, PetProfile, PetMedication, PetVaccination, PetWeightUnit, Profile, ProfileType };

// Backward-compatible alias while screens migrate naming.
export type DependentProfile = PersonProfile & {
  avatar?: string;
  hasCompletedProfile?: boolean;
};
