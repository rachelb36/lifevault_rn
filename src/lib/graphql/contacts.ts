/**
 * Centralized GraphQL operations and helpers for Contacts.
 *
 * Server Contact now stores firstName, lastName, organization, isFavorite,
 * and relationship as first-class columns. Entity linking is managed via
 * a ContactEntityLink join table with dedicated link/unlink mutations.
 */
import { gql } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import { getOrCreateVaultId } from "./entities";

// ─── Contact fragment with all fields ────────────────

const CONTACT_FIELDS = `
  id
  vaultId
  displayName
  firstName
  lastName
  organization
  phones
  emails
  addresses
  roleTags
  isFavorite
  relationship
  linkedEntityIds
  photoFileId
  notes
  createdAt
  updatedAt
`;

// ─── GraphQL Operations ─────────────────────────────

export const CONTACTS_QUERY = gql`
  query Contacts($vaultId: ID!, $entityId: ID) {
    contacts(vaultId: $vaultId, entityId: $entityId) {
      ${CONTACT_FIELDS}
    }
  }
`;

export const CREATE_CONTACT = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      ${CONTACT_FIELDS}
    }
  }
`;

export const UPDATE_CONTACT = gql`
  mutation UpdateContact($input: UpdateContactInput!) {
    updateContact(input: $input) {
      ${CONTACT_FIELDS}
    }
  }
`;

export const DELETE_CONTACT = gql`
  mutation DeleteContact($contactId: ID!) {
    deleteContact(contactId: $contactId)
  }
`;

export const LINK_CONTACT_TO_ENTITY = gql`
  mutation LinkContactToEntity($input: LinkContactToEntityInput!) {
    linkContactToEntity(input: $input) {
      id
      vaultId
      contactId
      entityId
      createdAt
    }
  }
`;

export const UNLINK_CONTACT_FROM_ENTITY = gql`
  mutation UnlinkContactFromEntity($input: UnlinkContactFromEntityInput!) {
    unlinkContactFromEntity(input: $input)
  }
`;

// ─── Server Contact Type ────────────────────────────

export type ServerContact = {
  id: string;
  vaultId: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  organization: string | null;
  phones: string[];
  emails: string[];
  addresses: string[];
  roleTags: string[];
  isFavorite: boolean;
  relationship: string | null;
  linkedEntityIds: string[];
  photoFileId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Category ↔ RoleTag Mapping ─────────────────────

import type { ContactCategory } from "@/features/contacts/data/storage";

const categoryToRoleTag: Record<string, string> = {
  Medical: "PRIMARY_CARE",
  Emergency: "EMERGENCY_CONTACT",
  School: "COUNSELOR",
  Other: "OTHER",
};

const roleTagToCategory: Record<string, ContactCategory> = {
  PRIMARY_CARE: "Medical",
  SPECIALIST: "Medical",
  THERAPIST: "Medical",
  PSYCHIATRY: "Medical",
  NEUROLOGY: "Medical",
  DENTIST: "Medical",
  OPTOMETRIST: "Medical",
  PHARMACY: "Medical",
  VETERINARIAN: "Medical",
  DOG_WALKER: "Service Provider",
  PET_SITTER: "Service Provider",
  SCHOOL_NURSE: "School",
  COUNSELOR: "School",
  EMERGENCY_CONTACT: "Emergency",
  OTHER: "Other",
};

export function categoriesToRoleTags(cats: ContactCategory[]): string[] {
  return cats
    .map((c) => categoryToRoleTag[c] ?? "OTHER")
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
}

export function roleTagsToCategories(tags: string[]): ContactCategory[] {
  if (!tags.length) return ["Other"];
  const cats = tags
    .map((t) => roleTagToCategory[t] ?? ("Other" as ContactCategory))
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
  return cats.length ? cats : ["Other"];
}

// ─── Server → Local Mapper ──────────────────────────

import type { Contact, ContactRelationship } from "@/features/contacts/data/storage";

function splitDisplayName(dn: string): { firstName: string; lastName: string } {
  const parts = dn.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function serverContactToLocal(sc: ServerContact): Contact {
  // Prefer explicit firstName/lastName; fall back to splitting displayName
  const firstName = sc.firstName || "";
  const lastName = sc.lastName || "";
  const hasParts = firstName || lastName;
  const fallback = hasParts ? { firstName, lastName } : splitDisplayName(sc.displayName);

  return {
    id: sc.id,
    firstName: hasParts ? firstName : fallback.firstName,
    lastName: hasParts ? lastName : fallback.lastName,
    organization: sc.organization ?? undefined,
    photo: undefined, // photoFileId is a server file ref, not a local URI
    phone: sc.phones[0] ?? "",
    email: sc.emails[0] ?? undefined,
    categories: roleTagsToCategories(sc.roleTags),
    relationship: sc.relationship ? (sc.relationship as ContactRelationship) : undefined,
    linkedProfiles: undefined, // entity links are managed server-side
    isFavorite: sc.isFavorite ?? false,
  };
}

// ─── Fetch / Mutate Helpers ─────────────────────────

export async function fetchContacts(
  client: ApolloClient<any>,
  entityId?: string,
): Promise<Contact[]> {
  const vaultId = await getOrCreateVaultId(client);
  const res = await client.query({
    query: CONTACTS_QUERY,
    variables: { vaultId, entityId: entityId || undefined },
    fetchPolicy: "network-only",
  });
  return ((res.data?.contacts ?? []) as ServerContact[]).map(
    serverContactToLocal,
  );
}

export async function serverCreateContact(
  client: ApolloClient<any>,
  c: Omit<Contact, "id"> & { id?: string },
): Promise<Contact> {
  const vaultId = await getOrCreateVaultId(client);
  const displayName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
  const res = await client.mutate({
    mutation: CREATE_CONTACT,
    variables: {
      input: {
        vaultId,
        displayName,
        firstName: c.firstName || null,
        lastName: c.lastName || null,
        organization: c.organization || null,
        phones: c.phone ? [c.phone] : [],
        emails: c.email ? [c.email] : [],
        addresses: [],
        roleTags: categoriesToRoleTags(c.categories ?? []),
        isFavorite: c.isFavorite ?? false,
        relationship: c.relationship || null,
        notes: null,
      },
    },
  });
  return serverContactToLocal(res.data.createContact as ServerContact);
}

export async function serverUpdateContact(
  client: ApolloClient<any>,
  c: Contact,
): Promise<Contact> {
  const displayName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
  const res = await client.mutate({
    mutation: UPDATE_CONTACT,
    variables: {
      input: {
        contactId: c.id,
        displayName,
        firstName: c.firstName || null,
        lastName: c.lastName || null,
        organization: c.organization || null,
        phones: c.phone ? [c.phone] : [],
        emails: c.email ? [c.email] : [],
        addresses: [],
        roleTags: categoriesToRoleTags(c.categories ?? []),
        isFavorite: c.isFavorite ?? false,
        relationship: c.relationship || null,
        notes: null,
      },
    },
  });
  return serverContactToLocal(res.data.updateContact as ServerContact);
}

export async function serverDeleteContact(
  client: ApolloClient<any>,
  contactId: string,
): Promise<void> {
  await client.mutate({
    mutation: DELETE_CONTACT,
    variables: { contactId },
  });
}

// ─── Entity Link Helpers ────────────────────────────

export async function serverLinkContactToEntity(
  client: ApolloClient<any>,
  contactId: string,
  entityId: string,
): Promise<void> {
  await client.mutate({
    mutation: LINK_CONTACT_TO_ENTITY,
    variables: { input: { contactId, entityId } },
  });
}

export async function serverUnlinkContactFromEntity(
  client: ApolloClient<any>,
  contactId: string,
  entityId: string,
): Promise<void> {
  await client.mutate({
    mutation: UNLINK_CONTACT_FROM_ENTITY,
    variables: { input: { contactId, entityId } },
  });
}
