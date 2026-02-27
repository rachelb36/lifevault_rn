/**
 * Centralized GraphQL operations, mappers, and helpers for Entities.
 *
 * Server Entity is a flat header (displayName, relationshipType, etc.).
 * Local ProfileModels are richer (firstName/lastName, kind/breed, etc.).
 * Mappers in this file bridge the two representations.
 */
import { gql } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import type { PersonProfile } from "@/features/people/domain/person.model";
import type { PetProfile } from "@/features/pets/domain/pet.model";
import type { HouseholdProfile } from "@/features/household/domain/household.model";
import type { Profile } from "@/features/profiles/domain/profile.model";
import type { RelationshipOption } from "@/features/people/constants/options";

// ─── GraphQL Operations ─────────────────────────────

export const MY_VAULTS = gql`
  query MyVaults {
    myVaults {
      id
      name
      createdAt
    }
  }
`;

export const CREATE_VAULT = gql`
  mutation CreateVault($input: CreateVaultInput!) {
    createVault(input: $input) {
      id
      name
      createdAt
    }
  }
`;

export const ENTITIES_QUERY = gql`
  query Entities($vaultId: ID!) {
    entities(vaultId: $vaultId) {
      id
      vaultId
      entityType
      displayName
      relationshipType
      relationshipOtherLabel
      dateOfBirth
      adoptionDate
      photoFileId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ENTITY = gql`
  mutation CreateEntity($input: CreateEntityInput!) {
    createEntity(input: $input) {
      id
      vaultId
      entityType
      displayName
      relationshipType
      relationshipOtherLabel
      dateOfBirth
      adoptionDate
      photoFileId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ENTITY = gql`
  mutation UpdateEntity($input: UpdateEntityInput!) {
    updateEntity(input: $input) {
      id
      vaultId
      entityType
      displayName
      relationshipType
      relationshipOtherLabel
      dateOfBirth
      adoptionDate
      photoFileId
      createdAt
      updatedAt
    }
  }
`;

// ─── Server Types ───────────────────────────────────

type ServerRelationshipType =
  | "PRIMARY"
  | "SPOUSE"
  | "PARTNER"
  | "CHILD"
  | "PARENT"
  | "GRANDPARENT"
  | "SIBLING"
  | "OTHER";

export type ServerVault = {
  id: string;
  name?: string | null;
  createdAt?: string | null;
};

export type ServerEntity = {
  id: string;
  vaultId: string;
  entityType: "PERSON" | "PET" | "HOUSEHOLD";
  displayName: string;
  relationshipType: ServerRelationshipType | null;
  relationshipOtherLabel: string | null;
  dateOfBirth: string | null;
  adoptionDate: string | null;
  photoFileId: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Vault ID Helper ────────────────────────────────

let _cachedVaultId: string | null = null;

export function clearVaultIdCache() {
  _cachedVaultId = null;
}

function sortVaultsNewestFirst(vaults: ServerVault[]): ServerVault[] {
  // If createdAt is missing, treat it as oldest.
  return [...vaults].sort((a, b) => {
    const aT = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bT = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bT - aT;
  });
}

export async function getOrCreateVaultId(
  client: ApolloClient<any>,
): Promise<string> {
  if (_cachedVaultId) return _cachedVaultId;

  const res = await client.query({
    query: MY_VAULTS,
    fetchPolicy: "network-only",
  });

  const vaults = (res.data?.myVaults ?? []) as ServerVault[];
  const newest = sortVaultsNewestFirst(vaults)[0];

  if (newest?.id) {
    _cachedVaultId = newest.id;
    return newest.id;
  }

  const created = await client.mutate({
    mutation: CREATE_VAULT,
    variables: { input: { name: "My Family Vault" } },
  });

  const id = created.data?.createVault?.id as string | undefined;
  if (!id) throw new Error("createVault did not return an id");

  _cachedVaultId = id;
  return id;
}

// ─── Relationship Mapping ───────────────────────────

/** Server RelationshipType → local relationship string + isPrimary flag */
function serverRelToLocal(
  relType: ServerRelationshipType | null,
  relLabel: string | null,
): { relationship: RelationshipOption | "Self"; isPrimary: boolean } {
  switch (relType) {
    case "PRIMARY":
      return { relationship: "Self", isPrimary: true };
    case "SPOUSE":
      return { relationship: "Spouse", isPrimary: false };
    case "PARTNER":
      return { relationship: "Partner", isPrimary: false };
    case "CHILD":
      return { relationship: "Child", isPrimary: false };
    case "PARENT":
      // Server has single PARENT; map label back to Mother/Father if available
      if (relLabel === "Mother")
        return { relationship: "Mother", isPrimary: false };
      if (relLabel === "Father")
        return { relationship: "Father", isPrimary: false };
      return { relationship: "Parent", isPrimary: false };
    case "GRANDPARENT":
      return { relationship: "Grandparent", isPrimary: false };
    case "SIBLING":
      // If RelationshipOption includes "Sibling", map it here. Otherwise keep as Other.
      return { relationship: "Other", isPrimary: false };
    case "OTHER":
      if (relLabel === "Caregiver")
        return { relationship: "Caregiver", isPrimary: false };
      return { relationship: "Other", isPrimary: false };
    default:
      return { relationship: "Other", isPrimary: false };
  }
}

/** Local relationship string → server RelationshipType + optional label */
export function localRelToServer(
  relationship: string,
  isPrimary?: boolean,
): { type: ServerRelationshipType; label?: string } {
  if (isPrimary) return { type: "PRIMARY" };

  const n = relationship.trim().toLowerCase();
  if (n === "self") return { type: "PRIMARY" };
  if (n === "spouse") return { type: "SPOUSE" };
  if (n === "partner") return { type: "PARTNER" };
  if (n === "child") return { type: "CHILD" };
  if (n === "mother") return { type: "PARENT", label: "Mother" };
  if (n === "father") return { type: "PARENT", label: "Father" };
  if (n === "parent") return { type: "PARENT" };
  if (n === "grandparent") return { type: "GRANDPARENT" };
  if (n === "sibling") return { type: "SIBLING" };
  if (n === "caregiver") return { type: "OTHER", label: "Caregiver" };

  return { type: "OTHER", label: relationship.trim() || "Other" };
}

// ─── Entity → Profile Mappers ───────────────────────

function toIsoDateOnly(isoString: string): string {
  return isoString.split("T")[0];
}

function splitDisplayName(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function entityToPersonProfile(entity: ServerEntity): PersonProfile {
  const { firstName, lastName } = splitDisplayName(entity.displayName);
  const { relationship, isPrimary } = serverRelToLocal(
    entity.relationshipType,
    entity.relationshipOtherLabel,
  );

  return {
    id: entity.id,
    profileType: "PERSON",
    firstName,
    lastName,
    preferredName: undefined,
    relationship,
    dob: entity.dateOfBirth ? toIsoDateOnly(entity.dateOfBirth) : undefined,
    avatarUri: undefined, // photoFileId requires download URL resolution; later
    isPrimary,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function entityToPetProfile(entity: ServerEntity): PetProfile {
  return {
    id: entity.id,
    profileType: "PET",
    petName: entity.displayName,
    kind: "Other", // Not in Entity header; lives in PET_BASICS record
    dob: entity.dateOfBirth ? toIsoDateOnly(entity.dateOfBirth) : undefined,
    adoptionDate: entity.adoptionDate
      ? toIsoDateOnly(entity.adoptionDate)
      : undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function entityToHouseholdProfile(
  entity: ServerEntity,
): HouseholdProfile {
  return {
    id: entity.id,
    profileType: "HOUSEHOLD",
    name: entity.displayName,
    memberIds: [], // Membership is vault-level in server mode
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

// ─── Server Fetch Helpers ───────────────────────────

async function fetchEntities(
  client: ApolloClient<any>,
): Promise<ServerEntity[]> {
  const vaultId = await getOrCreateVaultId(client);

  const res = await client.query({
    query: ENTITIES_QUERY,
    variables: { vaultId },
    fetchPolicy: "network-only",
  });

  return (res.data?.entities ?? []) as ServerEntity[];
}

export async function fetchPeopleProfiles(
  client: ApolloClient<any>,
): Promise<PersonProfile[]> {
  const entities = await fetchEntities(client);
  return entities
    .filter((e) => e.entityType === "PERSON")
    .map(entityToPersonProfile);
}

export async function fetchPetProfiles(
  client: ApolloClient<any>,
): Promise<PetProfile[]> {
  const entities = await fetchEntities(client);
  return entities.filter((e) => e.entityType === "PET").map(entityToPetProfile);
}

export async function fetchHouseholdProfiles(
  client: ApolloClient<any>,
): Promise<HouseholdProfile[]> {
  const entities = await fetchEntities(client);
  return entities
    .filter((e) => e.entityType === "HOUSEHOLD")
    .map(entityToHouseholdProfile);
}

export async function fetchAllProfiles(
  client: ApolloClient<any>,
): Promise<Profile[]> {
  const entities = await fetchEntities(client);

  const profiles: Profile[] = [];
  for (const e of entities) {
    if (e.entityType === "PERSON") profiles.push(entityToPersonProfile(e));
    else if (e.entityType === "PET") profiles.push(entityToPetProfile(e));
    else if (e.entityType === "HOUSEHOLD")
      profiles.push(entityToHouseholdProfile(e));
  }
  return profiles;
}

export async function fetchProfileById(
  client: ApolloClient<any>,
  profileId: string,
): Promise<Profile | null> {
  const all = await fetchAllProfiles(client);
  return all.find((p) => p.id === profileId) ?? null;
}
