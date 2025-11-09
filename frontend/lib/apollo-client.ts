import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { errorLink } from './graphql/error-link';
import { config } from './env';

const httpLink = new HttpLink({
  uri: config.strapiGraphqlUrl,
  credentials: 'same-origin',
});

const client = new ApolloClient({
  // 组合错误处理链接和 HTTP 链接
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          articles: {
            // 分页合并策略
            keyArgs: ['filters', 'sort'],
            merge(existing, incoming, { args }) {
              if (!existing || args?.pagination?.start === 0) {
                return incoming;
              }
              return {
                ...incoming,
                data: [...(existing?.data || []), ...(incoming?.data || [])],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all', // 返回部分数据 + 错误
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
