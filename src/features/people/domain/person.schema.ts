import type { RelationshipOption } from "@/features/people/constants/options";

export type PersonProfileV1 = {
  schemaVersion: 1;
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: RelationshipOption | "Self";
  dob?: string;
  avatarUri?: string;
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
};
