// ── Deck ────────────────────────────────────────────────────────────────────

const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(rank) {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank, 10);
}

function handTotal(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (!card.faceDown) {
      total += cardValue(card.rank);
      if (card.rank === 'A') aces++;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isRed(suit) {
  return suit === '♥' || suit === '♦';
}

// ── State ────────────────────────────────────────────────────────────────────

let deck = [];
let playerHand = [];
let dealerHand = [];
let gameActive = false;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const dealBtn         = document.getElementById('deal-btn');
const hitBtn          = document.getElementById('hit-btn');
const standBtn        = document.getElementById('stand-btn');
const dealerCardsEl   = document.getElementById('dealer-cards');
const playerCardsEl   = document.getElementById('player-cards');
const dealerScoreEl   = document.getElementById('dealer-score');
const playerScoreEl   = document.getElementById('player-score');
const resultMessageEl = document.getElementById('result-message');

// ── Rendering ────────────────────────────────────────────────────────────────

function renderCard(card) {
  const div = document.createElement('div');
  if (card.faceDown) {
    div.className = 'card face-down';
    div.textContent = '?';
  } else {
    div.className = 'card ' + (isRed(card.suit) ? 'red' : 'black');
    div.textContent = card.rank + card.suit;
  }
  return div;
}

function renderHands() {
  dealerCardsEl.innerHTML = '';
  playerCardsEl.innerHTML = '';

  for (const card of dealerHand) {
    dealerCardsEl.appendChild(renderCard(card));
  }
  for (const card of playerHand) {
    playerCardsEl.appendChild(renderCard(card));
  }

  // Show scores (only visible dealer cards)
  const visibleDealerTotal = handTotal(dealerHand);
  dealerScoreEl.textContent = gameActive
    ? '(' + visibleDealerTotal + '+)' // hole card still hidden
    : '(' + handTotal(dealerHand) + ')';
  playerScoreEl.textContent = '(' + handTotal(playerHand) + ')';
}

function setResult(msg) {
  resultMessageEl.textContent = msg;
}

function setButtons(active) {
  hitBtn.disabled  = !active;
  standBtn.disabled = !active;
  dealBtn.disabled  =  active;
}

// ── Game logic ────────────────────────────────────────────────────────────────

function drawCard(faceDown = false) {
  if (deck.length === 0) {
    deck = shuffle(buildDeck());
  }
  const card = deck.pop();
  card.faceDown = faceDown;
  return card;
}

function deal() {
  setResult('');
  deck = shuffle(buildDeck());

  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard(true)];

  gameActive = true;
  setButtons(true);
  renderHands();

  if (handTotal(playerHand) === 21) {
    revealAndResolve();
  }
}

function hit() {
  playerHand.push(drawCard());
  renderHands();

  if (handTotal(playerHand) > 21) {
    endGame('Bust! You lose.');
  } else if (handTotal(playerHand) === 21) {
    stand(); // auto-stand on 21
  }
}

function stand() {
  revealAndResolve();
}

function revealAndResolve() {
  dealerHand[1].faceDown = false;

  while (handTotal(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }

  renderHands();

  const playerTotal = handTotal(playerHand);
  const dealerTotal = handTotal(dealerHand);

  let message;
  if (playerTotal === 21 && playerHand.length === 2 && dealerTotal !== 21) {
    message = 'Blackjack!';
  } else if (dealerTotal > 21) {
    message = 'Dealer busts — you win!';
  } else if (playerTotal > dealerTotal) {
    message = 'You win!';
  } else if (playerTotal === dealerTotal) {
    message = 'Push.';
  } else {
    message = 'Dealer wins.';
  }

  endGame(message);
}

function endGame(message) {
  gameActive = false;
  setButtons(false);
  setResult(message);
  renderHands();
}

// ── Event listeners ──────────────────────────────────────────────────────────

dealBtn.addEventListener('click', deal);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);