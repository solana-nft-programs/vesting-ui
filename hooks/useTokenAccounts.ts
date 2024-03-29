import type { AccountData } from '@solana-nft-programs/common'
import * as spl from '@solana/spl-token'
import type { Connection, PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

import { useWalletId } from './useWalletId'

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

export const getTokenAccounts = async (
  connection: Connection,
  walletId: PublicKey | null
) => {
  if (!walletId) throw 'No wallet found'
  const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletId!,
    {
      programId: spl.TOKEN_PROGRAM_ID,
    }
  )
  const tokenAccounts = allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))
    .map((tokenAccount) => ({
      pubkey: tokenAccount.pubkey,
      parsed: tokenAccount.account.data.parsed.info as ParsedTokenAccountData,
    }))
  return tokenAccounts
}

export const useTokenAccounts = () => {
  const { connection } = useEnvironmentCtx()
  const walletId = useWalletId()
  return useQuery<AccountData<ParsedTokenAccountData>[]>(
    ['useTokenAccounts', walletId?.toString()],
    async () => {
      return getTokenAccounts(connection, walletId)
    },
    {
      enabled: !!walletId,
    }
  )
}
