import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";

const httpLink = new HttpLink({
  uri: "http://192.168.4.23:4000/graphql",
});

const authLink = setContext(async (_, { headers }) => {
  const token = await SecureStore.getItemAsync("accessToken");

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});