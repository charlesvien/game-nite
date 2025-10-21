import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { RAILWAY_API_TOKEN } from './env';

let client: ApolloClient | null = null;

export function getClient() {
  if (!client) {
    client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: 'https://backboard.railway.com/graphql/v2',
        headers: {
          Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
        },
        fetchOptions: { cache: 'no-store' },
      }),
      ssrMode: typeof window === 'undefined',
    });
  }
  return client;
}
