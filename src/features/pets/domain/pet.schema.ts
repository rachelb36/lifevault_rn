// Header-only pet profile schema — all other pet data lives in LifeVaultRecords.
export type PetProfileV1 = {
  schemaVersion: 1;
  id: string;
  petName: string;
  kind: string;
  kindOtherText?: string;
  breed?: string;
  breedOtherText?: string;
  dob?: string;
  gender?: string;
  avatarUri?: string;
  createdAt: string;
  updatedAt: string;
};
