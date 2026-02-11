import { gql } from "@apollo/client";

export const MY_VAULTS = gql`
  query MyVaults {
    myVaults {
      id
    }
  }
`;

export const CREATE_VAULT = gql`
  mutation CreateVault($input: CreateVaultInput!) {
    createVault(input: $input) {
      id
    }
  }
`;

export const CREATE_ENTITY = gql`
  mutation CreateEntity($input: CreateEntityInput!) {
    createEntity(input: $input) {
      id
      displayName
      dateOfBirth
      adoptionDate
    }
  }
`;

export const UPSERT_RECORD = gql`
  mutation UpsertRecord($input: UpsertRecordInput!) {
    upsertRecord(input: $input) {
      id
      recordType
      updatedAt
    }
  }
`;