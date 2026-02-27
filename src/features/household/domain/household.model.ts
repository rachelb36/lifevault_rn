export type HouseholdProfile = {
  id: string;
  profileType: "HOUSEHOLD";
  name: string;
  address?: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};
