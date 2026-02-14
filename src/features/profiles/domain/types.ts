export type ModuleType =
  | "medical"
  | "vaccinations"
  | "insurance"
  | "documents"
  | "emergency"
  | "travel"
  | "education"
  | "academic"
  | "activities";

export type Module = {
  id: ModuleType;
  name: string;
  icon: any;
};

export type PassportItem = {
  id: string;
  backendId?: string;
  country: string;
  fullName: string;
  passportNumber: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  isCard: boolean;
};

export type LoyaltyProgram = {
  id: string;
  programType: "airline" | "hotel" | "car" | "other";
  providerName: string;
  memberNumber: string;
};

export type TravelData = {
  passports: PassportItem[];
  loyaltyPrograms: LoyaltyProgram[];
  notes: string;
  hideEmptyRows: boolean;
};

export type DependentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  relationship: string;
  isPrimary?: boolean;
  dob?: string;
  avatar?: string;
  travel?: TravelData;
  hasCompletedProfile?: boolean;
  moduleNotes?: Record<string, string>;
};

export type UserProfile = {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob?: string;
  avatar?: string;
  hasCompletedProfile?: boolean;
};
