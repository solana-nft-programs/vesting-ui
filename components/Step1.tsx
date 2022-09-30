import { css } from '@emotion/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ChevronRight } from 'assets/ChevronRight'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { ButtonSmall } from 'common/ButtonSmall'
import { Input } from 'common/Input'
import { Textarea } from 'common/Textarea'
import { useHandleCollection } from 'handlers/useHandleCollection'
import { useTokenAccounts } from 'hooks/useTokenAccounts'
import { useEffect, useState } from 'react'

export const Step1 = ({
  setResults,
}: {
  setResults: (mints: string[] | undefined) => void
}) => {
  const tokenAccounts = useTokenAccounts()
  const [collectionInput, setCollectionInput] = useState<string>()
  const [mintIdsInput, setMintIdsInput] = useState<string>()
  const handleCollection = useHandleCollection()
  const wallet = useWallet()

  useEffect(() => {
    setMintIdsInput(
      handleCollection.data?.mintIds?.map((v) => v.toString()).join(',')
    )
  }, [handleCollection.data?.mintIds?.toString()])

  useEffect(() => {
    setResults(mintIdsInput?.split(','))
  }, [mintIdsInput])

  const missingMintIds = mintIdsInput
    ?.split(',')
    .filter((v) => !tokenAccounts.data?.some((tk) => tk.parsed.mint === v))

  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="flex w-full flex-col">
        <div className="mb-2 text-3xl text-light-0">Step 1</div>
        <div className="text-lg text-medium-3">
          Enter a verified creator or mint list.
        </div>
        <div className="mb-4 text-base italic text-medium-3">
          This will find all tokens available in your connected wallet to vest
        </div>
        <div className="mb-4 flex w-full justify-between gap-6">
          <Input
            className="w-full"
            placeholder="Verified creator"
            onChange={(e) => {
              handleCollection.reset()
              setCollectionInput(e.target.value)
            }}
          />
          <Button
            className="px-6"
            loading={handleCollection.isLoading}
            inlineLoader
            disabled={!tokenAccounts.data}
            onClick={() => {
              handleCollection.mutate({ input: collectionInput })
            }}
          >
            Find
          </Button>
        </div>
        {!wallet.connected && <div>Connect wallet first</div>}
        {!!handleCollection.data?.message && (
          <Alert className="mb-4" variant="success">
            {handleCollection.data?.message}
          </Alert>
        )}
        {!!handleCollection.error && (
          <Alert
            className="mb-4"
            variant="error"
          >{`${handleCollection.error}`}</Alert>
        )}
        <div className="mb-4 flex items-center justify-center">OR</div>
        <Textarea
          className="mb-4 min-h-[200px] max-w-full text-light-4"
          placeholder="Comma separated list of mint IDs"
          value={mintIdsInput}
          onChange={(e) => {
            handleCollection.reset()
            setMintIdsInput(e.target.value)
          }}
        />
        {mintIdsInput &&
          mintIdsInput?.length > 0 &&
          (missingMintIds && missingMintIds?.length > 0 ? (
            <Alert className="mb-4" variant="error">
              {missingMintIds?.join(',')} not found in wallet
            </Alert>
          ) : (
            <Alert className="mb-4" variant="success">
              {mintIdsInput.split(',').length} valid mints found in wallet
            </Alert>
          ))}
        <ButtonSmall
          className="flex items-center justify-center gap-[10px] text-light-0"
          onClick={() => {
            window.scrollTo({ top: 1400, behavior: 'smooth' })
          }}
        >
          <div>Next</div>
          <ChevronRight />
        </ButtonSmall>
      </div>
      <div
        className="h-[800px] w-full"
        css={css`
          box-sizing: border-box;
          box-shadow: inset -10vw 0 100px 0 #0b0b0b;
          background: url(/images/verified-creator.png) no-repeat;
        `}
      />
    </div>
  )
}
