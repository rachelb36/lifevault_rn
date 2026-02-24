import type { RelationshipOption } from "@/features/people/constants/options";

export type PersonProfile = {
  id: string;
  profileType: "PERSON";
  isPrimary?: boolean;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: RelationshipOption | "Self";
  dob?: string;
  avatarUri?: string;
  createdAt: string;
  updatedAt: string;
};
