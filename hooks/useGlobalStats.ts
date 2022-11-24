import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { useQuery } from 'react-query'

type StatKey = 'active-tokens' | 'total-tokens' | 'total-wallets'
export const statsNames: StatKey[] = [
  'active-tokens',
  'total-tokens',
  'total-wallets',
]

export const useGlobalStats = () => {
  const index = new ApolloClient({
    uri: 'https://welcome-elk-85.hasura.app/v1/graphql',
    cache: new InMemoryCache({ resultCaching: false }),
  })
  const v1Index = new ApolloClient({
    uri: 'https://prod-holaplex.hasura.app/v1/graphql',
    cache: new InMemoryCache({ resultCaching: false }),
  })
  return useQuery<
    | {
        [n: string]: { data: number }
      }
    | undefined
  >(['useGlobalStats'], async () => {
    const queryResult = await index.query({
      query: gql`
        query GetTokenManagers {
          q1: acc_176_aggregate(where: { invalidationType: { _eq: "5" } }) {
            aggregate {
              count
            }
          }
          q2: acc_176_aggregate(
            where: { invalidationType: { _eq: "5" } }
            distinct_on: recipientTokenAccount
            order_by: { recipientTokenAccount: desc }
          ) {
            aggregate {
              count(distinct: true)
            }
          }
        }
      `,
    })
    const queryData = queryResult.data as {
      q1?: { aggregate?: { count?: number } }
      q2?: { aggregate?: { count?: number } }
    }
    const v1Results = await v1Index.query({
      query: gql`
        query GetTokenManagers {
          q1: cardinal_claim_events_aggregate(
            where: { invalidation_type: { _eq: "5" } }
          ) {
            aggregate {
              count
            }
          }
          q2: cardinal_claim_events_aggregate(
            where: { invalidation_type: { _eq: "5" } }
            distinct_on: recipient_token_account
            order_by: { recipient_token_account: asc }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
    })
    const v1Data = v1Results.data as {
      q1?: { aggregate?: { count?: number } }
      q2?: { aggregate?: { count?: number } }
    }
    return {
      'active-tokens': { data: queryData.q1?.aggregate?.count ?? 0 },
      'total-tokens': {
        data:
          (v1Data.q1?.aggregate?.count ?? 0) +
          (queryData.q1?.aggregate?.count ?? 0),
      },
      'total-wallets': {
        data:
          (v1Data.q2?.aggregate?.count ?? 0) +
          (queryData.q2?.aggregate?.count ?? 0),
      },
    }
  })
}

export const statsNameMapping: { key: StatKey; displayName: string }[] = [
  {
    key: 'active-tokens',
    displayName: 'Active Tokens',
  },
  {
    key: 'total-tokens',
    displayName: 'Vested Tokens',
  },
  {
    key: 'total-wallets',
    displayName: 'Unique Wallets',
  },
]
