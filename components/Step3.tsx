import type { Transaction } from '@solana/web3.js'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { ButtonSmall } from 'common/ButtonSmall'
import { notify } from 'common/Notification'
import { Textarea } from 'common/Textarea'
import { Tooltip } from 'common/Tooltip'
import { useHandleExecuteTransactions } from 'handlers/useHandleExecuteTransactions'
import { useHandleVestingSchedule } from 'handlers/useHandleVestingSchedule'
import { useState } from 'react'
import { BiRefresh } from 'react-icons/bi'
import { FaDownload } from 'react-icons/fa'

import type { WalletShare } from './Step2'
import { VestingSlotRow } from './VestingSlotRow'

export const Step3 = ({
  mintIds,
  walletShares,
}: {
  mintIds: string[] | undefined
  walletShares: WalletShare[] | undefined
}) => {
  const handleVestingSchedule = useHandleVestingSchedule()
  const [vestingSchedule, setVestingSchedule] = useState<string>()
  const [startTimeSeconds, setStartTimeSeconds] = useState<number>(
    Date.now() / 1000
  )
  const handleExecuteTransactions = useHandleExecuteTransactions()
  return (
    <div className="flex min-h-[800px] w-full flex-wrap items-start justify-between gap-8">
      <div className="flex w-full flex-col">
        <div className="mb-2 text-3xl text-light-0">Step 3</div>
        <div className="text-lg text-medium-3">Begin vesting.</div>
        <div className="flex items-center justify-between">
          <div className="mb-4 text-base italic text-medium-3">
            Generate a vesting schedule from the above inputs or paste in your
            own vesting schedule
          </div>
          <div
            className="flex cursor-pointer items-center justify-center gap-2 text-medium-3"
            onClick={() => setStartTimeSeconds(Date.now() / 1000)}
          >
            <div>Start Time:</div>
            <div>
              {new Date(startTimeSeconds * 1000).toLocaleString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <BiRefresh className={`text-2xl`} />
          </div>
        </div>
        <div className="mb-4 flex items-start gap-4">
          <Textarea
            className="min-h-[100px] w-full text-light-4"
            placeholder="Vesting schedule generated from the above inputs in the format of comma separated rows on separate lines containing [mint_id,wallet,release_unix_seconds]"
            value={vestingSchedule}
            onChange={(e) => {
              handleVestingSchedule.reset()
              setVestingSchedule(e.target.value)
            }}
          />
          <div className="flex flex-col gap-4">
            <Tooltip title="Generate a vesting schedule from the above inputs">
              <div>
                <Button
                  loading={handleVestingSchedule.isLoading}
                  inlineLoader
                  onClick={() => {
                    setVestingSchedule('')
                    handleVestingSchedule.mutate(
                      {
                        mintIds,
                        walletShares,
                        vestingSchedule: undefined,
                        startTimeSeconds,
                      },
                      {
                        onSuccess: (vestingSlots) => {
                          setVestingSchedule(
                            vestingSlots
                              .map(
                                (v) =>
                                  `${
                                    v.mintId?.toString() ?? ''
                                  },${v.address.toString()},${v.releaseSeconds.toString()}`
                              )
                              .join('\n')
                          )
                        },
                      }
                    )
                  }}
                >
                  <div className="w-full text-center">Generate</div>
                </Button>
              </div>
            </Tooltip>
            <ButtonSmall
              onClick={() => {
                notify({ message: 'Not implemented yet' })
              }}
            >
              <div className="flex w-full items-center justify-center gap-4 text-center">
                <div>Save</div>
                <FaDownload />
              </div>
            </ButtonSmall>
          </div>
        </div>
        {!handleVestingSchedule.isLoading && !!handleVestingSchedule.error && (
          <Alert className="mb-4" variant="error">
            {`${handleVestingSchedule.error}`}
          </Alert>
        )}
        <div className="flex flex-col gap-4">
          {vestingSchedule &&
          !handleVestingSchedule.data &&
          !handleVestingSchedule.error ? (
            <ButtonSmall
              loading={handleVestingSchedule.isLoading}
              onClick={() => {
                handleVestingSchedule.mutate(
                  {
                    mintIds: [],
                    walletShares: [],
                    vestingSchedule,
                    startTimeSeconds,
                  },
                  {
                    onSuccess: (vestingSlots) => {
                      setVestingSchedule(
                        vestingSlots
                          .map(
                            (v) =>
                              `${
                                v.mintId?.toString() ?? ''
                              },${v.address.toString()},${v.releaseSeconds.toString()}`
                          )
                          .join('\n')
                      )
                    },
                  }
                )
              }}
            >
              <div className="flex w-full items-center justify-center gap-4 text-center">
                Generate transactions
              </div>
            </ButtonSmall>
          ) : (
            handleVestingSchedule.data && (
              <div>
                <div className="w-full overflow-x-scroll rounded-xl border border-border p-4">
                  <div className="flex w-full gap-4 rounded-xl bg-dark-4 px-8 py-2">
                    <div className="flex-[2]">Mint</div>
                    <div className="flex-[2]">Address</div>
                    <div className="flex-[2]">Release</div>
                    <div className="flex-[2]">Transaction</div>
                    <div className="flex-1">Link</div>
                  </div>
                  <div className="flex flex-col px-8">
                    {handleVestingSchedule.data?.map((v) => (
                      <VestingSlotRow
                        key={v.mintId?.toString()}
                        v={v}
                        loading={handleExecuteTransactions.isLoading}
                        refresh={() =>
                          handleVestingSchedule.mutate(
                            {
                              mintIds: [],
                              walletShares: [],
                              vestingSchedule,
                              startTimeSeconds,
                            },
                            {
                              onSuccess: (vestingSlots) => {
                                setVestingSchedule(
                                  vestingSlots
                                    .map(
                                      (v) =>
                                        `${
                                          v.mintId?.toString() ?? ''
                                        },${v.address.toString()},${v.releaseSeconds.toString()}`
                                    )
                                    .join('\n')
                                )
                              },
                            }
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end px-8">
                  <Button
                    className="py-1"
                    loading={handleExecuteTransactions.isLoading}
                    onClick={() => {
                      handleExecuteTransactions.mutate(
                        {
                          transactions: handleVestingSchedule.data
                            .map((v) => v.transaction)
                            .filter((t): t is Transaction => !!t),
                        },
                        {
                          onSettled: () => {
                            handleVestingSchedule.mutate(
                              {
                                mintIds: [],
                                walletShares: [],
                                vestingSchedule,
                                startTimeSeconds,
                              },
                              {
                                onSuccess: (vestingSlots) => {
                                  setVestingSchedule(
                                    vestingSlots
                                      .map(
                                        (v) =>
                                          `${
                                            v.mintId?.toString() ?? ''
                                          },${v.address.toString()},${v.releaseSeconds.toString()}`
                                      )
                                      .join('\n')
                                  )
                                },
                              }
                            )
                          },
                        }
                      )
                    }}
                  >
                    Send all
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
