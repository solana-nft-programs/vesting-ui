import { tryPublicKey } from '@cardinal/common'
import { withIssueToken } from '@cardinal/token-manager'
import { getTimeInvalidators } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/accounts'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import {
  InvalidationType,
  TokenManagerKind,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagers } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { asWallet } from 'common/wallet'
import type { WalletShare } from 'components/Step2'
import { getTokenAccounts } from 'hooks/useTokenAccounts'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation } from 'react-query'

const SLOT_THRESHOLD_SECONDS = 60 * 60 * 1 // 1 hours
const PAYMENT_MANAGER_RECIPIENT = new PublicKey(
  'crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr'
)
const LAMPORTS = 0.025 * LAMPORTS_PER_SOL

const generateSlots = (
  walletShares: WalletShare[],
  startTimeSeconds: number
): VestingSlot[] => {
  return walletShares.reduce((acc, w) => {
    const walletSlots = []
    const share = w.share ?? 0

    for (let i = 0; i < share; i++) {
      const address = tryPublicKey(w.address)
      if (!address) throw `Invalid address ${w.address}`
      if (!w.durationSeconds) {
        throw `Invalid duration seconds ${w.durationSeconds} for ${w.address}`
      }

      const releaseSeconds = Math.floor(
        startTimeSeconds +
          w.durationSeconds *
            ((i + 1) / share) *
            (SLOT_THRESHOLD_SECONDS / SLOT_THRESHOLD_SECONDS)
      )

      if (releaseSeconds < 0) throw 'Negative release seconds'
      walletSlots.push({
        mintId: null,
        address: address,
        releaseSeconds: releaseSeconds,
        transaction: null,
        link: null,
        txLink: null,
      })
    }
    return [...acc, ...walletSlots]
  }, [] as VestingSlot[])
}

export type VestingSlot = {
  mintId: PublicKey | null
  address: PublicKey
  releaseSeconds: number
  transaction: Transaction | null
  link: string | null
  txLink: string | null
}
export const useHandleVestingSchedule = () => {
  const wallet = asWallet(useWallet())
  const { connection } = useEnvironmentCtx()

  return useMutation(
    async ({
      mintIds,
      walletShares,
      vestingSchedule,
      startTimeSeconds,
    }: {
      mintIds: string[] | undefined
      walletShares: WalletShare[] | undefined
      vestingSchedule: string | undefined
      startTimeSeconds: number
    }): Promise<VestingSlot[]> => {
      if (!mintIds) throw 'No mint ids found. Input mint list in step 1'
      if (!walletShares) throw 'No wallet shares'
      const vestingSlots = vestingSchedule
        ? vestingSchedule
            ?.split(/\r?\n/)
            .map((s) => s.split(','))
            .map(([m, a, r]) => {
              const address = tryPublicKey(a)
              if (!address) throw 'Invalid address in vesting schedule found'
              const releaseSeconds = Number(r)
              if (!releaseSeconds)
                throw 'Invalid number in vesting schedule found'
              return {
                mintId: tryPublicKey(m),
                address: address,
                releaseSeconds: Number(r),
                transaction: null,
                link: null,
                txLink: null,
              }
            })
        : generateSlots(walletShares, startTimeSeconds)
      mintIds = vestingSchedule
        ? vestingSlots.map((v) => v.mintId!.toString())
        : mintIds

      const tokenAccounts = await getTokenAccounts(connection, wallet.publicKey)

      // get token managers for missing mints
      const issuedMints = mintIds.filter(
        (v) => !tokenAccounts.some((tk) => tk.parsed.mint === v)
      )
      const missingTokenManagerIds = await Promise.all(
        issuedMints.map(
          async (m) => (await findTokenManagerAddress(new PublicKey(m)))[0]
        )
      )
      const tokenManagers =
        missingTokenManagerIds.length > 0
          ? await getTokenManagers(connection, missingTokenManagerIds).catch(
              () => {
                throw 'Mint not found in wallet and also not already issued'
              }
            )
          : []

      // get corresponding time invalidators
      const timeInvalidatorIds = await Promise.all(
        tokenManagers.map(
          async (tm) => (await findTimeInvalidatorAddress(tm.pubkey))[0]
        )
      )
      const timeInvalidators =
        timeInvalidatorIds.length > 0
          ? await getTimeInvalidators(connection, timeInvalidatorIds).catch(
              () => {
                throw 'Time invalidator not found for active token manager'
              }
            )
          : []

      // collect data for missing mints
      const issuedTokenDatas = issuedMints.map((mintId) => {
        const tokenManager = tokenManagers.find(
          (tm) => tm.parsed.mint.toString() === mintId
        )
        if (!tokenManager)
          throw 'Mint not found in wallet and also not already issued'
        const timeInvalidator = timeInvalidators.find((ti) =>
          ti.parsed.tokenManager.equals(tokenManager?.pubkey)
        )
        if (!timeInvalidator)
          throw 'Time invalidator not found for active token manager'

        return {
          mintId,
          tokenManager,
          timeInvalidator,
        }
      })

      const placedMints: string[] = []
      const slots = vestingSlots.map((w) => {
        // insert found token in slot
        const foundTokenData = issuedTokenDatas.find(
          ({ tokenManager, timeInvalidator }) =>
            tokenManager.parsed.claimApprover?.equals(w.address) &&
            Math.abs(
              (timeInvalidator.parsed.maxExpiration?.toNumber() ?? 0) -
                w.releaseSeconds
            ) < SLOT_THRESHOLD_SECONDS
        )
        if (foundTokenData) {
          placedMints.push(foundTokenData?.mintId.toString())
        }
        if (
          foundTokenData &&
          w.mintId &&
          foundTokenData.mintId !== w.mintId.toString()
        ) {
          throw 'Mismatched slot'
        }
        return {
          ...w,
          mintId:
            w.mintId ??
            (foundTokenData ? foundTokenData.tokenManager.parsed.mint : null),
          transaction: null,
          link: foundTokenData
            ? `https://rent.cardinal.so/claim/${foundTokenData?.tokenManager.pubkey.toString()}`
            : null,
          txLink: foundTokenData
            ? `https://explorer.solana.com/address/${foundTokenData?.tokenManager.pubkey.toString()}`
            : null,
        }
      })

      // check if all missing mints found a slot
      if (placedMints.length !== issuedMints.length) {
        throw `${issuedMints.find(
          (m) => !placedMints.includes(m)
        )} issued but not placed in vesting slot`
      }

      const remainingMints = mintIds.filter((m) => !placedMints.includes(m))
      const filledSlots: VestingSlot[] = []
      for (const slot of slots) {
        if (!slot.txLink) {
          const mint = tryPublicKey(remainingMints.shift())
          if (!mint) throw 'Not enough mints to match all vesting slots'
          const issuerTokenAccount = tokenAccounts.find(
            (tk) => tk.parsed.mint === mint.toString()
          )
          if (!issuerTokenAccount) {
            throw 'Error finding token account to issue token from'
          }
          const transaction = new Transaction()
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: PAYMENT_MANAGER_RECIPIENT,
              lamports: LAMPORTS,
            })
          )
          await withIssueToken(transaction, connection, wallet, {
            mint,
            issuerTokenAccountId: issuerTokenAccount.pubkey,
            invalidationType: InvalidationType.Vest,
            kind: TokenManagerKind.Edition,
            visibility: 'permissioned',
            permissionedClaimApprover: slot.address,
            timeInvalidation: {
              maxExpiration: slot.releaseSeconds,
            },
          })
          filledSlots.push({ ...slot, mintId: mint, transaction: transaction })
        } else {
          filledSlots.push(slot)
        }
      }

      return filledSlots
    }
  )
}
