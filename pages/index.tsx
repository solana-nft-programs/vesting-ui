import { Step1 } from 'components/Step1'
import type { WalletShare } from 'components/Step2'
import { Step2 } from 'components/Step2'
import { Step3 } from 'components/Step3'
import Head from 'next/head'
import { useState } from 'react'

import { FooterSlim } from '../common/FooterSlim'
import { MainHero } from '../components/MainHero'

function Home() {
  const [mintIds, setMintIds] = useState<string[]>()
  const [walletShares, setWalletShares] = useState<WalletShare[]>()

  return (
    <div className="relative bg-dark-5">
      <Head>
        <title> Vesting UI</title>
        <meta name="description" content=" Staking UI" />
        <link rel="icon" href={'/favicon.ico'} />
        <script
          defer
          data-domain="stake.host.so"
          src="https://plausible.io/js/plausible.js"
        ></script>
      </Head>
      <MainHero />
      <div className="z-10 mx-auto mt-48 flex flex-col gap-16 px-8 md:px-16">
        <Step1 setResults={(mintIds) => setMintIds(mintIds)} />
        <Step2 setResults={(walletShares) => setWalletShares(walletShares)} />
        <Step3 mintIds={mintIds} walletShares={walletShares} />
      </div>
      <FooterSlim />
    </div>
  )
}

export default Home
