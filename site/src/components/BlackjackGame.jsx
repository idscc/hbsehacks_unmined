import { useState, useCallback } from 'react'
import styles from './BlackjackGame.module.css'

const RANKS = 'A23456789TJQK'
const SUITS = '♠♥♦♣'

function makeDeck() {
  const deck = []
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ rank: r, suit: s })
    }
  }
  return deck
}

function shuffle(deck) {
  const out = [...deck]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function value(card) {
  if (card.rank === 'A') return 11
  if ('TJQK'.includes(card.rank)) return 10
  return parseInt(card.rank, 10)
}

function score(hand) {
  let total = hand.reduce((s, c) => s + value(c), 0)
  let aces = hand.filter((c) => c.rank === 'A').length
  while (total > 21 && aces) {
    total -= 10
    aces--
  }
  return total
}

function isBlackjack(hand) {
  return hand.length === 2 && score(hand) === 21
}

export default function BlackjackGame({ spinBalance, onSpinsChange }) {
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [phase, setPhase] = useState('bet') // bet | play | dealer | result
  const [bet, setBet] = useState(1)
  const [resultMessage, setResultMessage] = useState(null)

  const playerTotal = score(playerHand)
  const canBet = spinBalance >= 1 && phase === 'bet'

  const deal = useCallback(() => {
    const newDeck = shuffle(makeDeck())
    const p1 = [newDeck.pop(), newDeck.pop()]
    const d1 = [newDeck.pop(), newDeck.pop()]
    setDeck(newDeck)
    setPlayerHand(p1)
    setDealerHand(d1)
    setPhase('play')
    setResultMessage(null)
  }, [])

  function handlePlaceBet() {
    const b = Math.floor(Number(bet)) || 1
    if (b < 1 || b > spinBalance) return
    onSpinsChange(-b)
    setBet(b)
    deal()
  }

  function hit() {
    if (phase !== 'play' || deck.length === 0) return
    const newDeck = [...deck]
    const card = newDeck.pop()
    setDeck(newDeck)
    setPlayerHand((h) => [...h, card])
    if (score([...playerHand, card]) > 21) {
      setPhase('result')
      setResultMessage('Bust! You lose.')
    }
  }

  function stand() {
    if (phase !== 'play') return
    let d = [...dealerHand]
    let dDeck = [...deck]
    while (score(d) < 17 && dDeck.length) {
      const c = dDeck.pop()
      d = [...d, c]
    }
    setDealerHand(d)
    setDeck(dDeck)
    setPhase('result')
    const betAmount = bet
    const p = playerTotal
    const dScore = score(d)
    if (isBlackjack(playerHand) && !isBlackjack(d)) {
      setResultMessage(`Blackjack! +${Math.floor(betAmount * 2.5)} spins`)
      onSpinsChange(Math.floor(betAmount * 2.5))
    } else if (isBlackjack(d) && !isBlackjack(playerHand)) {
      setResultMessage('Dealer blackjack. You lose.')
    } else if (dScore > 21 || p > dScore) {
      setResultMessage(`You win! +${betAmount * 2} spins`)
      onSpinsChange(betAmount * 2)
    } else if (p < dScore) {
      setResultMessage('Dealer wins.')
    } else {
      setResultMessage('Push. Bet returned.')
      onSpinsChange(betAmount)
    }
  }

  function reset() {
    setPlayerHand([])
    setDealerHand([])
    setDeck([])
    setPhase('bet')
    setResultMessage(null)
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Blackjack</h2>
      <p className={styles.sectionTitle}>Spins: {spinBalance}</p>

      {phase === 'bet' && (
        <>
          <div className={styles.betRow}>
            <label>
              Bet: <input
                type="number"
                min={1}
                max={spinBalance}
                className={styles.betInput}
                value={bet}
                onChange={(e) => setBet(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
            </label>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePlaceBet} disabled={!canBet}>
              Deal
            </button>
          </div>
        </>
      )}

      {(phase === 'play' || phase === 'dealer' || phase === 'result') && (
        <>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Dealer {phase !== 'play' ? `(${score(dealerHand)})` : ''}</p>
            <div className={styles.hand}>
              {dealerHand.map((c, i) => (
                <span key={i} className={styles.cardChip}>{c.rank}{c.suit}</span>
              ))}
            </div>
          </div>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>You ({score(playerHand)})</p>
            <div className={styles.hand}>
              {playerHand.map((c, i) => (
                <span key={i} className={styles.cardChip}>{c.rank}{c.suit}</span>
              ))}
            </div>
          </div>
          {phase === 'play' && (
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={hit}>Hit</button>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={stand}>Stand</button>
            </div>
          )}
          {phase === 'result' && resultMessage && (
            <>
              <p className={`${styles.result} ${resultMessage.includes('lose') ? styles.lose : resultMessage.includes('win') || resultMessage.includes('+') ? styles.win : styles.push}`}>
                {resultMessage}
              </p>
              <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={reset} style={{ marginTop: '0.5rem' }}>
                New hand
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
