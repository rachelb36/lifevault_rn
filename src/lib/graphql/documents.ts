/**
 * Centralized GraphQL operations and helpers for Documents (server-mode files).
 *
 * Documents are File rows with optional metadata (title, tags, note, fileName).
 * Pattern follows records.ts / contacts.ts conventions.
 */
import { gql } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import { getOrCreateVaultId } from "./entities";

// ─── Fragment ────────────────────────────────────────

const FILE_FIELDS = `
  id
  vaultId
  entityId
  recordId
  mimeType
  byteSize
  storagePath
  fileName
  title
  tags
  note
  createdAt
  updatedAt
`;

// ─── Queries ─────────────────────────────────────────

export const DOCUMENTS_QUERY = gql`
  query Documents($vaultId: ID!, $entityId: ID, $recordId: ID) {
    documents(vaultId: $vaultId, entityId: $entityId, recordId: $recordId) {
      ${FILE_FIELDS}
    }
  }
`;

export const FILE_DOWNLOAD_URL_QUERY = gql`
  query FileDownloadUrl($fileId: ID!) {
    fileDownloadUrl(fileId: $fileId)
  }
`;

// ─── Mutations ───────────────────────────────────────

export const UPDATE_FILE_META = gql`
  mutation UpdateFileMeta($input: UpdateFileMetaInput!) {
    updateFileMeta(input: $input) {
      ${FILE_FIELDS}
    }
  }
`;

export const DETACH_FILE = gql`
  mutation DetachFile($input: DetachFileInput!) {
    detachFile(input: $input) {
      ${FILE_FIELDS}
    }
  }
`;

// ─── Server Document Type ────────────────────────────

export type ServerDocument = {
  id: string;
  vaultId: string;
  entityId: string | null;
  recordId: string | null;
  mimeType: string;
  byteSize: number;
  storagePath: string;
  fileName: string | null;
  title: string | null;
  tags: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Fetch Helpers ───────────────────────────────────

export async function fetchDocuments(
  client: ApolloClient<any>,
  opts?: { entityId?: string; recordId?: string },
): Promise<ServerDocument[]> {
  const vaultId = await getOrCreateVaultId(client);
  const res = await client.query({
    query: DOCUMENTS_QUERY,
    variables: {
      vaultId,
      entityId: opts?.entityId ?? undefined,
      recordId: opts?.recordId ?? undefined,
    },
    fetchPolicy: "network-only",
  });
  return (res.data?.documents ?? []) as ServerDocument[];
}

export async function fetchFileDownloadUrl(
  client: ApolloClient<any>,
  fileId: string,
): Promise<string> {
  const res = await client.query({
    query: FILE_DOWNLOAD_URL_QUERY,
    variables: { fileId },
    fetchPolicy: "network-only",
  });
  return res.data.fileDownloadUrl as string;
}

export async function serverUpdateFileMeta(
  client: ApolloClient<any>,
  input: {
    fileId: string;
    title?: string | null;
    tags?: string[];
    note?: string | null;
    fileName?: string | null;
  },
): Promise<ServerDocument> {
  const res = await client.mutate({
    mutation: UPDATE_FILE_META,
    variables: { input },
  });
  return res.data.updateFileMeta as ServerDocument;
}

export async function serverDetachFile(
  client: ApolloClient<any>,
  fileId: string,
): Promise<ServerDocument> {
  const res = await client.mutate({
    mutation: DETACH_FILE,
    variables: { input: { fileId } },
  });
  return res.data.detachFile as ServerDocument;
}
