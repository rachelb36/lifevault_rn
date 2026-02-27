/**
 * Centralized GraphQL operations and helpers for Records.
 *
 * Server Record stores payload as opaque JSON — same structure as local
 * StoredRecord.data. The normalization pipeline in the storage layer
 * handles both local and server sourced data identically.
 */
import { gql } from "@apollo/client";
import type { ApolloClient } from "@apollo/client";
import { getOrCreateVaultId } from "./entities";

// ─── GraphQL Operations ─────────────────────────────

export const RECORDS_QUERY = gql`
  query Records($vaultId: ID!, $entityId: ID) {
    records(vaultId: $vaultId, entityId: $entityId) {
      id
      vaultId
      entityId
      recordType
      payload
      payloadVersion
      source
      privacy
      fileIds
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

export const UPSERT_RECORD = gql`
  mutation UpsertRecord($input: UpsertRecordInput!) {
    upsertRecord(input: $input) {
      id
      vaultId
      entityId
      recordType
      payload
      payloadVersion
      source
      privacy
      fileIds
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_RECORD = gql`
  mutation DeleteRecord($input: DeleteRecordInput!) {
    deleteRecord(input: $input) {
      id
    }
  }
`;

// ─── Server Record Type ─────────────────────────────

export type ServerRecord = {
  id: string;
  vaultId: string;
  entityId: string | null;
  recordType: string;
  payload: Record<string, unknown> | null;
  payloadVersion: number;
  source: string;
  privacy: string;
  fileIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// ─── Fetch Helpers ──────────────────────────────────

export async function fetchRecordsForEntity(
  client: ApolloClient<any>,
  entityId: string,
): Promise<ServerRecord[]> {
  const vaultId = await getOrCreateVaultId(client);
  const res = await client.query({
    query: RECORDS_QUERY,
    variables: { vaultId, entityId },
    fetchPolicy: "network-only",
  });
  return (res.data?.records ?? []) as ServerRecord[];
}

export async function serverUpsertRecord(
  client: ApolloClient<any>,
  opts: {
    recordId: string;
    entityId: string;
    recordType: string;
    payload: Record<string, unknown>;
    isPrivate?: boolean;
  },
): Promise<ServerRecord> {
  const vaultId = await getOrCreateVaultId(client);
  const res = await client.mutate({
    mutation: UPSERT_RECORD,
    variables: {
      input: {
        vaultId,
        recordId: opts.recordId,
        entityId: opts.entityId,
        recordType: opts.recordType,
        payload: opts.payload,
        privacy: opts.isPrivate ? "SENSITIVE" : "STANDARD",
      },
    },
  });
  return res.data.upsertRecord as ServerRecord;
}

export async function serverDeleteRecord(
  client: ApolloClient<any>,
  recordId: string,
): Promise<void> {
  await client.mutate({
    mutation: DELETE_RECORD,
    variables: { input: { recordId } },
  });
}
