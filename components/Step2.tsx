import { ChevronRight } from 'assets/ChevronRight'
import { Button } from 'common/Button'
import { ButtonSmall } from 'common/ButtonSmall'
import { DurationInput } from 'common/DurationInput'
import { Input } from 'common/Input'
import { Textarea } from 'common/Textarea'
import { publicKeyValidationTest } from 'common/utils'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'

const walletShareSchema = Yup.object({
  address: Yup.string().test(
    'is-public-key',
    'Invalid multplier mint address',
    publicKeyValidationTest
  ),
  share: Yup.number(),
  durationSeconds: Yup.number(),
})

const formSchema = Yup.object({
  walletShares: Yup.array().of(walletShareSchema),
})

export type WalletShare = Yup.InferType<typeof walletShareSchema>
export type FormSchema = Yup.InferType<typeof formSchema>

export const Step2 = ({
  setResults,
}: {
  setResults: (results: WalletShare[] | undefined) => void
}) => {
  const defaultWalletShare = {
    address: '',
    share: undefined,
    durationSeconds: undefined,
  }
  const initialValues: FormSchema = {
    walletShares: [defaultWalletShare],
  }
  const formState = useFormik({
    initialValues,
    onSubmit: () => {},
    validationSchema: walletShareSchema,
  })
  const { values, setFieldValue } = formState
  const walletShares = values.walletShares ?? []

  const [walletSharesInput, setWalletSharesInput] = useState<string>()

  const shareRows = values.walletShares
    ?.filter(
      (w) => (w.address && w.address.length > 0) || w.share || w.durationSeconds
    )
    .map(
      (w) => `${w.address ?? ''},${w.share ?? ''},${w.durationSeconds ?? ''}`
    )

  useEffect(() => {
    if (shareRows && shareRows.length > 0) {
      setWalletSharesInput(shareRows?.join('\n'))
    }
  }, [shareRows?.join(',')])

  useEffect(() => {
    const shares = walletSharesInput
      ?.split(/\r?\n/)
      .map((s) => s.split(','))
      .map(([w, s, r]) => ({
        address: w ?? undefined,
        share: Number(s) ? Number(s) : undefined,
        durationSeconds: Number(r) ? Number(r) : undefined,
      }))

    formState.setValues({ walletShares: shares })
    setResults(shares)
  }, [walletSharesInput])

  return (
    <div className="flex min-h-[800px] flex-wrap items-start justify-between gap-8 overflow-x-scroll">
      <div className="flex flex-col">
        <div className="mb-2 text-3xl text-light-0">Step 2</div>
        <div className="text-lg text-medium-3">
          Specify recipient addresses, share and final release.
        </div>
        <div className="mb-4 text-base italic text-medium-3">
          Add all recipients and their share of tokens. All shares must add up
          to total tokens above
        </div>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <Input
              className="w-1/4 min-w-[100px]"
              type="text"
              placeholder={'CmAy...A3fD'}
              value={walletShares[0]?.address}
              onChange={(e) => {
                setFieldValue(`walletShares[0].address`, e.target.value)
              }}
            />
            <Input
              className="w-1/4 min-w-[100px]"
              type="number"
              placeholder={'Share'}
              value={walletShares[0]?.share}
              onChange={(e) => {
                setFieldValue(`walletShares[0].share`, e.target.value)
              }}
            />
            <DurationInput
              className="w-1/4"
              placeholder={'Release after'}
              handleChange={(v) =>
                setFieldValue(`walletShares[0].durationSeconds`, v)
              }
              defaultOption={'hours'}
            />
            <Button
              onClick={() => {
                setFieldValue(`walletShares`, [
                  defaultWalletShare,
                  ...walletShares,
                ])
              }}
            >
              Add
            </Button>
          </div>
          {walletShares?.map(
            (v, i) =>
              i > 0 && (
                <div className="flex flex-row gap-4" key={i}>
                  <Input
                    className="w-1/4 min-w-[100px]"
                    type="text"
                    placeholder={'CmAy...A3fD'}
                    value={v.address}
                    onChange={(e) => {
                      setFieldValue(
                        `walletShares[${i}].address`,
                        e.target.value
                      )
                    }}
                  />
                  <Input
                    className="w-1/4 min-w-[100px]"
                    type="number"
                    placeholder={'Share'}
                    value={v.share}
                    onChange={(e) => {
                      setFieldValue(`walletShares[${i}].share`, e.target.value)
                    }}
                  />
                  <DurationInput
                    placeholder={'Release after'}
                    handleChange={(v) =>
                      setFieldValue(`walletShares[${i}].durationSeconds`, v)
                    }
                    defaultOption={'hours'}
                  />
                  <Button
                    onClick={() => {
                      setFieldValue(
                        `walletShares`,
                        walletShares.filter((_, ix) => ix !== i)
                      )
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )
          )}
        </div>
        <div className="mb-4 flex items-center justify-center">OR</div>
        <Textarea
          className="mb-4 min-h-[200px] text-light-4"
          placeholder="Comma separated rows on separate lines containing [wallet,share,release_duration_seconds]"
          value={walletSharesInput}
          onChange={(e) => setWalletSharesInput(e.target.value)}
        />
        <ButtonSmall
          className="flex items-center justify-center gap-[10px] text-light-0"
          onClick={() => {
            window.scrollBy({ top: 800, behavior: 'smooth' })
          }}
        >
          <div>Generate Schedule</div>
          <ChevronRight />
        </ButtonSmall>
      </div>
    </div>
  )
}
