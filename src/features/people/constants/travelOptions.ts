export const TRAVEL_ID_OPTIONS = [
  "TSA PreCheck",
  "Global Entry",
  "NEXUS",
  "SENTRI",
  "FAST",
  "Other Trusted Traveler Program",
] as const;

export type TravelIdOption = (typeof TRAVEL_ID_OPTIONS)[number];

export const TRAVEL_LOYALTY_TYPE_OPTIONS = [
  "Airline",
  "Hotel",
  "Car Rental",
  "Booking Site / OTA",
  "Other",
] as const;

export type TravelLoyaltyTypeOption = (typeof TRAVEL_LOYALTY_TYPE_OPTIONS)[number];
