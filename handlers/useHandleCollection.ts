import { getBatchedMultipleAccounts } from '@cardinal/common'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { PublicKey } from '@solana/web3.js'
import { getTokenAccounts } from 'hooks/useTokenAccounts'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation } from 'react-query'

export type ParsedTokenAccountData = {
  isNative: boolean
  delegate: string
  mint: string
  owner: string
  state: 'initialized' | 'frozen'
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export type MintIdResults = { mintIds?: PublicKey[]; message?: string }

export const useHandleCollection = () => {
  const { connection } = useEnvironmentCtx()
  const walletId = useWalletId()

  return useMutation(
    async ({
      input,
    }: {
      input: string | undefined
    }): Promise<MintIdResults> => {
      if (!input) throw 'Invalid input'
      const tokenAccounts = (
        await getTokenAccounts(connection, walletId)
      ).filter((tk) => tk.parsed.state !== 'frozen')
      console.log(tokenAccounts)

      if (!tokenAccounts) throw 'No token accounts found'
      const metaplexIds = await Promise.all(
        tokenAccounts.map(
          async (tokenAccount) =>
            (
              await metaplex.MetadataProgram.findMetadataAccount(
                new PublicKey(tokenAccount.parsed.mint)
              )
            )[0]
        )
      )
      const metaplexAccountInfos = await getBatchedMultipleAccounts(
        connection,
        metaplexIds
      )
      const metaplexData = metaplexAccountInfos.reduce(
        (acc, accountInfo, i) => {
          try {
            acc[tokenAccounts[i]!.pubkey.toString()] = {
              pubkey: metaplexIds[i]!,
              ...accountInfo,
              data: metaplex.MetadataData.deserialize(
                accountInfo?.data as Buffer
              ) as metaplex.MetadataData,
            }
          } catch (e) {}
          return acc
        },
        {} as {
          [tokenAccountId: string]: {
            pubkey: PublicKey
            data: metaplex.MetadataData
          }
        }
      )

      const tokenDatas = tokenAccounts.map((tokenAccount, i) => ({
        tokenAccount,
        metaplexData: metaplexData[tokenAccount.pubkey.toString()],
      }))

      const collectionTokenDatas = tokenDatas.filter((tk) =>
        tk.metaplexData?.data.data.creators?.some(
          (c) => c.verified && c.address === input
        )
      )
      return {
        mintIds: collectionTokenDatas.map(
          (tokenData) => new PublicKey(tokenData.tokenAccount.parsed.mint)
        ),
      }
    }
  )
}
