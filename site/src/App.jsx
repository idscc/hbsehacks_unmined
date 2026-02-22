import { useState } from 'react'
import Tabs from './components/Tabs'
import SendXRP from './components/SendXRP'
import PlaceholderTab from './components/PlaceholderTab'
import BalanceTab from './components/BalanceTab'
import HistoryTab from './components/HistoryTab'
import Settings from './components/Settings'
import ExchangeRatesTab from './components/ExchangeRatesTab'
import WithdrawalsTab from './components/WithdrawalsTab'
import SpinPage from './components/SpinPage'
import ErrorBoundary from './components/ErrorBoundary'
import styles from './App.module.css'

const TAB_CONFIG = [
  { id: 'send', label: 'Insuring Value', icon: '↗' },
  { id: 'withdrawals', label: 'Withdrawals', icon: '↓' },
  { id: 'rates', label: 'Rates', icon: '▤' },
  { id: 'history', label: 'History', icon: '◷' },
  { id: 'balance', label: 'Balance', icon: '◉' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

function App() {
  const [activeTab, setActiveTab] = useState('send')
  const [page, setPage] = useState('main') // 'main' | 'spin'

  if (page === 'spin') {
    return <SpinPage onBack={() => setPage('main')} />
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <h1>Unmined </h1>
        </div>
        <p className={styles.subtitle}>Insuring Value on the ledger</p>
      </header>

      <Tabs
        tabs={TAB_CONFIG}
        activeTab={activeTab}
        onSelect={setActiveTab}
      />

      <main className={styles.main}>
        <ErrorBoundary>
          {activeTab === 'send' && <SendXRP />}
          {activeTab === 'withdrawals' && <WithdrawalsTab />}
          {activeTab === 'rates' && <ExchangeRatesTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'balance' && <BalanceTab />}
          {activeTab === 'settings' && <Settings onOpenSpin={() => setPage('spin')} />}
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
