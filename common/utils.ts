import { tryPublicKey } from '@solana-nft-programs/common'

export const publicKeyValidationTest = (value: string | undefined): boolean => {
  return tryPublicKey(value) ? true : false
}
