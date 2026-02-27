export type HouseholdProfileV1 = {
  schemaVersion: 1;
  id: string;
  name: string;
  address?: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};
