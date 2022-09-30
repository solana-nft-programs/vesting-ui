import { shortPubKey } from '@cardinal/common'
import { Button } from 'common/Button'
import { useHandleExecuteTransaction } from 'handlers/useHandleExecuteTransaction'
import type { VestingSlot } from 'handlers/useHandleVestingSchedule'

export const VestingSlotRow = ({
  v,
  loading,
  refresh,
}: {
  v: VestingSlot
  loading: boolean
  refresh: () => void
}) => {
  const handleExecuteTransaction = useHandleExecuteTransaction()
  const txLink =
    v.txLink ??
    (handleExecuteTransaction.data
      ? `https://explorer.solana.com/tx/${handleExecuteTransaction.data}`
      : null)
  const link =
    v.link ??
    (handleExecuteTransaction.data
      ? `https://rent.cardinal.so/claim/${v.mintId?.toString()}`
      : null)

  return (
    <div
      key={v.mintId?.toString()}
      className="flex w-full gap-4 border-b border-border py-4 md:flex-row"
    >
      <div className="flex-[2]">{shortPubKey(v.mintId)}</div>
      <div className="flex-[2]">{shortPubKey(v.address)}</div>
      <div className="flex-[2]">
        {new Date(v.releaseSeconds * 1000).toLocaleString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      <div className="flex-[2]">
        {txLink ? (
          <a
            href={txLink}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >
            View
          </a>
        ) : (
          '-'
        )}
      </div>
      <div className="flex-1">
        {v.transaction && !handleExecuteTransaction.data ? (
          <div className="flex">
            <Button
              className="py-1"
              loading={loading || handleExecuteTransaction.isLoading}
              onClick={() => {
                handleExecuteTransaction.mutate(
                  {
                    transaction: v.transaction!,
                  },
                  {
                    onSuccess: () => refresh(),
                  }
                )
              }}
            >
              Send
            </Button>
          </div>
        ) : link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >
            View
          </a>
        ) : (
          <div>Link N/A</div>
        )}
      </div>
    </div>
  )
}
