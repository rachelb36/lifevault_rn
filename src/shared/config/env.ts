export const ENV = {
  GRAPHQL_URL:
    process.env.EXPO_PUBLIC_GRAPHQL_URL ?? "http://127.0.0.1:4000/graphql",
  LOCAL_ONLY:
    (process.env.EXPO_PUBLIC_LOCAL_ONLY ?? "").toLowerCase() === "true",
} as const;
