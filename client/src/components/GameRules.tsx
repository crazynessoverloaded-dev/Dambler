import { HelpCircle } from 'lucide-react';

const GAME_RULES: Record<string, { title: string; points: string[] }> = {
  plinko: {
    title: 'How to Play Plinko',
    points: [
      'Set your bet and risk level, then click Drop Ball.',
      'The ball falls through pegs and lands in a numbered bucket at the bottom.',
      'Each bucket has a multiplier — landing there pays bet × that multiplier.',
      'Edge buckets (e.g. 20×) pay big but are very rare. Centre buckets pay small but often.',
      'Higher risk = more extreme multipliers on both ends, lower risk = steadier results.',
      'Auto-bet lets you queue multiple drops in a row automatically.',
    ],
  },
  crash: {
    title: 'How to Play Crash',
    points: [
      'Place your bet, then click BET — the round begins with a 3-second countdown.',
      'A multiplier grows from 1× upwards. Click CASH OUT before it crashes.',
      'If the game crashes before you cash out, you lose your entire bet.',
      'Cash out early (e.g. 1.5×) for safer, smaller wins — hold longer for a bigger reward.',
      'The crash point is random every round. There is no pattern to predict.',
      'Example: $10 bet, cash out at 3×  → you receive $30.',
    ],
  },
  dice: {
    title: 'How to Play Dice',
    points: [
      'Choose OVER or UNDER 50, then pick a risk level and click Roll.',
      'A random number between 1–100 is generated.',
      'Low risk: wins pay 1.5× | Medium: 1.96× | High: 2.5× your bet.',
      'If the roll matches your prediction (e.g. you picked OVER and rolled 73), you win.',
      'Example: $10 bet, Medium risk, OVER → roll 62 → win $19.60.',
      'Use Auto-Bet to repeat rolls automatically without clicking each time.',
    ],
  },
  hilo: {
    title: 'How to Play Hi-Lo',
    points: [
      'A card is shown face-up. Predict whether the next card will be HIGHER or LOWER.',
      'Each correct guess multiplies your running winnings.',
      'Click Cash Out at any time to lock in your current profit.',
      'Cards are A (low) through K (high). A tie on the same rank loses.',
      'Cards near A or 2 are easiest to guess Higher; cards near K are easiest to guess Lower.',
      'Example: $10 bet → 3 correct guesses at 1.4× each → cash out $27.44.',
    ],
  },
  mines: {
    title: 'How to Play Mines',
    points: [
      'A 5×5 grid hides bombs. Click any tile to reveal what is underneath.',
      'A gem = safe — your multiplier grows. A bomb = you lose your bet instantly.',
      'Click Cash Out at any time to collect bet × your current multiplier.',
      'The more bombs you set, the higher the multiplier grows per gem found.',
      'Reveal every safe tile without hitting a bomb = auto-win at maximum multiplier.',
      'Example: $10 bet, 3 bombs, reveal 5 gems → cash out at 2.4× → $24.',
    ],
  },
  keno: {
    title: 'How to Play Keno',
    points: [
      'Pick between 1 and 10 numbers from the grid (1–40).',
      'Click Bet — 10 numbers are drawn at random.',
      'The more of your picks that match the drawn numbers, the bigger the payout.',
      'Matching all 10 of your picks can pay up to 3,000× your bet.',
      'Picking fewer numbers is easier to match fully but has a lower maximum payout.',
      'Example: pick 5 numbers, match all 5 → win roughly 40× your bet.',
    ],
  },
  'guess-the-cup': {
    title: 'How to Play Guess the Cup',
    points: [
      'Click BET — a coin is hidden under one of the three cups.',
      'Watch the cups shuffle. Try to track which cup hides the coin.',
      'After shuffling stops, click the cup you think holds the coin.',
      'Correct pick pays 2× your bet. Wrong pick loses your bet.',
      'Win chance is 48%. The shuffle is random — focus and track carefully.',
      'Example: $10 bet, pick the right cup → win $20.',
    ],
  },
  'scratch-cards': {
    title: 'How to Play Scratch Cards',
    points: [
      'Click BUY CARD to purchase a scratch card for your chosen price.',
      'Click each grey tile to scratch it off and reveal a symbol underneath.',
      'Match 3 identical symbols anywhere on the 9-tile grid to win.',
      '💎 = 50× | 💰 = 20× | ⭐ = 10× | 🔔 = 5× | 🍒 = 3× | 🍋 = 2× your card price.',
      'No match = you lose the card price. Use Reveal All to uncover all tiles at once.',
      'Example: $5 card, reveal three 🍒 → win $15 (3× $5).',
    ],
  },
  blackjack: {
    title: 'How to Play Blackjack',
    points: [
      'Goal: get a hand total closer to 21 than the dealer without going over (busting).',
      'Face cards (J, Q, K) = 10. Aces = 1 or 11 (whichever helps you more).',
      'Hit = take another card. Stand = stop. Double Down = double your bet and take exactly one more card.',
      'Dealer must keep drawing on 16 or below, and must stand on 17 or above.',
      'Blackjack (Ace + 10-value on first 2 cards) pays 3:2 (e.g. $10 bet → $15 profit).',
      'Win pays 1:1. Tie = push (bet returned). Bust = you lose the bet.',
    ],
  },
  baccarat: {
    title: 'How to Play Baccarat',
    points: [
      'Bet on Player, Banker, or Tie before any cards are dealt.',
      'Two cards each are dealt to Player and Banker. Closest hand to 9 wins.',
      'Cards 10–K = 0. Ace = 1. Totals above 9 drop the tens digit (e.g. 15 = 5).',
      'Player win pays 1:1. Banker win pays 0.95:1 (5% commission). Tie pays 8:1.',
      'A third card may be drawn automatically — you don\'t decide this, it follows fixed rules.',
      'Example: bet $10 on Banker, Banker wins → receive $9.50 profit.',
    ],
  },
  'three-card-poker': {
    title: 'How to Play Three Card Poker',
    points: [
      'You and the dealer each receive 3 cards. You see your cards, one dealer card is face-up.',
      'Pair Plus bet: pays based solely on your hand (Pair → Straight Flush). Dealer doesn\'t matter.',
      'Ante bet: decide to Fold (lose ante) or Call (place an equal second bet to continue).',
      'Dealer needs Queen-high or better to "qualify." If not, ante wins 1:1 and call is returned.',
      'Hand strength (high→low): Straight Flush > Three of a Kind > Straight > Flush > Pair > High Card.',
      'Example: $10 Ante, you have a Flush, dealer qualifies and has Pair → you win $10.',
    ],
  },
  'video-poker': {
    title: 'How to Play Video Poker',
    points: [
      'Place your bet and click Deal. You receive 5 cards.',
      'Click cards you want to KEEP, then click Draw — unkept cards are replaced.',
      'Your final 5-card hand is evaluated and paid according to the pay table.',
      'Jacks or Better (pair of J, Q, K, or A) = 1:1. Two Pair = 2:1. Trips = 3:1.',
      'Straight = 4:1. Flush = 6:1. Full House = 9:1. Four-of-a-Kind = 25:1.',
      'Straight Flush = 50:1. Royal Flush (A-K-Q-J-10 same suit) = 800:1 jackpot.',
    ],
  },
  'casino-war': {
    title: 'How to Play Casino War',
    points: [
      'Place your bet. You and the dealer each receive one card — higher card wins.',
      'Aces are the highest card. Suits don\'t matter.',
      'Your card beats dealer\'s card → you win 1:1. Dealer beats you → you lose.',
      'Tie: choose Surrender (lose half your bet) or Go to War (double your bet).',
      'Going to War: one more card each — higher card wins the doubled bet.',
      'Example: $10 bet, your card is higher → win $10.',
    ],
  },
  'dragon-tiger': {
    title: 'How to Play Dragon Tiger',
    points: [
      'One card is dealt face-up to Dragon and one to Tiger.',
      'Bet on Dragon, Tiger, or Tie before the cards are dealt.',
      'Higher card wins. Suits don\'t count — only the rank matters.',
      'Dragon win pays 1:1. Tiger win pays 1:1. Tie pays 8:1.',
      'If you bet Dragon or Tiger and there\'s a tie, you lose half your bet.',
      'Example: $10 on Dragon, Dragon gets K, Tiger gets 7 → win $10.',
    ],
  },
  'red-dog': {
    title: 'How to Play Red Dog',
    points: [
      'Two cards are dealt face-up. Bet whether the third card falls BETWEEN them in rank.',
      'The spread (gap between the two cards) determines the payout odds.',
      'Spread 1 = 5:1 | Spread 2 = 4:1 | Spread 3 = 2:1 | Spread 4 or more = 1:1.',
      'After seeing the first two cards you may raise your bet before the third is revealed.',
      'If the two cards are consecutive (e.g. 7 and 8), there is no spread — it\'s a push.',
      'Example: cards are 3 and 9 (spread 5). Third card is 6 → win 1:1.',
    ],
  },
  roulette: {
    title: 'How to Play Roulette',
    points: [
      'Place chips on the table before clicking Spin. You can make multiple bets at once.',
      'Single number bet pays 35:1 but is hardest to hit.',
      'Red/Black, Odd/Even, 1–18/19–36 all pay 1:1 and cover nearly half the wheel.',
      'Dozens (1–12, 13–24, 25–36) pay 2:1. Columns also pay 2:1.',
      'Zero (0) is a green pocket — it beats all Red/Black and Odd/Even bets.',
      'Example: $10 on Red, ball lands on Red 14 → win $10 profit.',
    ],
  },
  slots: {
    title: 'How to Play Slots',
    points: [
      'Set your bet per line and click SPIN.',
      'Match 3 or more identical symbols left-to-right on any of the 5 paylines to win.',
      '4 in a row = 3× the base payout. 5 in a row = 10× the base payout.',
      '🍒 3× | 🍋 3× | 🍇 4× | 🔔 6× | ⭐ 10× | 💎 20× | 7️⃣ 50× (all per $1 bet, 3-of-a-kind).',
      '5× Seven = $500 per $1 bet. 5× Diamond = $200. 5× Star = $100.',
      '3 or more Scatter (🎰) anywhere on the grid = 10 Free Spins bonus round.',
    ],
  },
  sicbo: {
    title: 'How to Play Sic Bo',
    points: [
      'Place your bets on the table, then click Roll to shake three dice.',
      'Big bet (total 11–17): pays 1:1. Small bet (total 4–10): pays 1:1.',
      'Specific total (e.g. exactly 9): pays based on how likely that total is (e.g. 6:1 for 9).',
      'Any Triple (all three dice same): pays 30:1. Specific Triple (e.g. three 5s): pays 180:1.',
      'Combination bet (two specific numbers): pays 6:1.',
      'Example: $10 on Big, dice roll 14 → win $10.',
    ],
  },
  craps: {
    title: 'How to Play Craps',
    points: [
      'Pass Line bet: roll a 7 or 11 on the Come-Out roll → win 1:1. Roll 2, 3, or 12 → lose.',
      'Any other Come-Out number becomes the "Point." Roll the Point again before a 7 → win.',
      'Don\'t Pass is the opposite: you\'re betting against the shooter.',
      'Once a Point is set, you can add Odds bets behind your Pass Line for no house edge.',
      'Come/Don\'t Come bets work like Pass/Don\'t Pass but are placed after the Point is set.',
      'Example: $10 Pass Line, Come-Out is 8 (Point), next roll is 8 → win $10.',
    ],
  },
  bigsix: {
    title: 'How to Play Big Six',
    points: [
      'Place a bet on a segment of the wheel before spinning.',
      '$1 segment pays 1:1. $2 pays 2:1. $5 pays 5:1. $10 pays 10:1. $20 pays 20:1.',
      'Logo/Joker segment pays up to 40:1 but appears very rarely.',
      'The wheel is spun and the pointer stops on a random segment.',
      'Your segment coming up = you win at the stated odds. Any other segment = lose.',
      'Example: $10 on $5 segment, wheel stops there → win $50.',
    ],
  },
  coinflip: {
    title: 'How to Play Coin Flip',
    points: [
      'Choose Heads or Tails, then click the flip button.',
      'The coin flips and lands on one side — match your pick and win.',
      'Win pays 1.98× your bet (e.g. $10 bet → $19.80 returned, $9.80 profit).',
      'Lose = you lose your bet. The result is 50/50 every single flip.',
      'Example: $25 on Heads, coin lands Heads → receive $49.50 (profit $24.50).',
    ],
  },
  limbo: {
    title: 'How to Play Limbo',
    points: [
      'Enter a target multiplier (e.g. 2×, 10×, 100×) and your bet, then Launch.',
      'A random multiplier is generated each round.',
      'If the result equals or exceeds your target, you win bet × target.',
      'If the result is below your target, you lose your bet.',
      'Higher target = bigger payout but much lower chance of winning.',
      'Example: $10 bet, target 5× → result is 7× → win $50.',
    ],
  },
  tower: {
    title: 'How to Play Tower',
    points: [
      'Set your bet and difficulty, then click Start Climb.',
      'Each floor has 4 tiles — click one to reveal it.',
      'Safe tile ✓ = you advance to the next floor and your multiplier grows.',
      'Bomb 💣 = you lose your bet immediately.',
      'Click Cash Out any time after floor 1 to collect bet × current multiplier.',
      'Easy: 1 bomb/floor. Medium: 2 bombs. Hard: 3 bombs — more bombs = bigger multipliers.',
    ],
  },
  'chuck-a-luck': {
    title: 'How to Play Chuck-a-Luck',
    points: [
      'Pick a number from 1 to 6, then click Roll to shake three dice.',
      'Count how many of the three dice show your chosen number.',
      '0 matches = you lose your bet.',
      '1 match = win 1:1 (e.g. $10 bet → $10 profit).',
      '2 matches = win 2:1 (e.g. $10 bet → $20 profit).',
      '3 matches = win 10:1 (e.g. $10 bet → $100 profit).',
    ],
  },
  'andar-bahar': {
    title: 'How to Play In or Out',
    points: [
      'A Joker card is placed face-up in the centre of the table.',
      'Bet on IN (left side) or OUT (right side) before cards are dealt.',
      'Cards are dealt alternately IN then OUT until one matches the Joker\'s rank.',
      'If your chosen side receives the matching rank first, you win.',
      'IN pays 0.9:1. OUT pays 1:1. IN is statistically slightly more likely to win.',
      'Example: $10 on OUT, matching card appears on OUT side → win $10.',
    ],
  },
  wheel: {
    title: 'How to Play Wheel',
    points: [
      'Choose a risk level: Low (steady small wins), Medium (balanced), or High (rare big wins).',
      'Set your bet and click Spin — the wheel stops on a random segment.',
      'The multiplier on your landed segment is your payout (0× = lose, 5× = win 5× bet).',
      'Low risk has many 1× and 2× segments. High risk has mostly 0× with occasional 500×.',
      'All results are random — past spins have no effect on the next spin.',
      'Example: $10 bet, wheel lands on 5× → win $50.',
    ],
  },
  pontoon: {
    title: 'How to Play Pontoon',
    points: [
      'British Blackjack — all dealer cards are face-down until the end.',
      'Goal: beat the dealer\'s hand without exceeding 21.',
      'Pontoon (Ace + 10-value card) = best hand, pays 2:1.',
      '5-Card Trick (5 cards totalling 21 or under) also pays 2:1.',
      'Twist = Hit (draw a card free). Buy = Hit for an additional bet (doubles your stake).',
      'Stick = Stand (you must have 15+ or hold 5 cards). Dealer beats ties.',
    ],
  },
  'caribbean-stud': {
    title: 'How to Play Caribbean Stud',
    points: [
      'Place an Ante bet. You and the dealer each get 5 cards. One dealer card is face-up.',
      'Look at your cards and decide: Fold (lose Ante) or Call (place a 2× Ante call bet).',
      'Dealer must have Ace-King or better to "qualify" and play against you.',
      'Dealer doesn\'t qualify → Ante wins 1:1, Call bet is returned.',
      'Dealer qualifies and you win → Ante wins 1:1; Call pays by hand rank.',
      'Call payouts: Pair 1:1 · Two Pair 2:1 · Trips 3:1 · Straight 4:1 · Flush 5:1 · Full House 7:1 · Quads 20:1 · Straight Flush 50:1.',
    ],
  },
  'casino-holdem': {
    title: "How to Play Casino Hold'em",
    points: [
      'Place an Ante bet. You and the dealer each get 2 hole cards + 3 community cards (the Flop).',
      'After seeing the Flop, decide: Fold (lose Ante) or Call (place a 2× Ante call bet).',
      'Turn and River cards are revealed. Best 5-card hand from your 2 + 5 community wins.',
      'Dealer needs Pair of 4s or better to qualify.',
      'Dealer doesn\'t qualify → Ante wins 1:1, Call is returned.',
      'Call payouts: Pair 1:1 · Two Pair 2:1 · Trips 3:1 · Straight 4:1 · Flush 5:1 · Full House 7:1 · Quads 10:1 · Straight Flush 20:1.',
    ],
  },
  'lightning-dice': {
    title: 'How to Play Lightning Dice',
    points: [
      'Pick a total sum (3–18) that you think three dice will roll, then click Strike.',
      'Before rolling, 1–3 random sums are struck by Lightning and get huge boosted multipliers (25×–100×).',
      'If your chosen sum is a Lightning sum and the dice hit it, you win the boosted multiplier.',
      'If not a Lightning sum, standard payouts apply based on probability.',
      'Common totals (9–12) pay less but appear more often. Rare totals (3 or 18) pay 150:1.',
      'Example: pick 10, it gets Lightning 50× boost, dice roll 10 → $10 bet wins $500.',
    ],
  },
  bingo: {
    title: 'How to Play Bingo',
    points: [
      'Buy a card for your chosen price — a 5×5 grid is generated with random numbers.',
      'Balls are drawn automatically one at a time. Numbers on your card are marked off.',
      'Get 5 in a row — horizontally, vertically, or diagonally — to win BINGO!',
      'The FREE space (centre) counts as any number for all directions.',
      'Up to 38 balls are drawn. If no BINGO by ball 38, you lose your card price.',
      'Win pays 4× your card price. Example: $10 card → win $40.',
    ],
  },
  rps: {
    title: 'How to Play Rock Paper Scissors',
    points: [
      'Choose Rock, Paper, or Scissors by clicking the corresponding button.',
      'Rock beats Scissors. Scissors beats Paper. Paper beats Rock.',
      'If you beat the house, you win 2× your bet (e.g. $10 bet → $20 returned, $10 profit).',
      'If the house beats you, you lose your bet.',
      'A draw returns your bet in full — no profit, no loss.',
      'Example: $10 bet, you pick Rock, house picks Scissors → win $20.',
    ],
  },
  'classic-slots': {
    title: 'How to Play Classic Slots',
    points: [
      'Set your bet and click SPIN — three reels spin and stop on random symbols.',
      'Match all 3 symbols on the centre pay line to win: 3× your payout multiplier.',
      'Match 2 identical symbols on the centre line for a partial (smaller) payout.',
      '🍒 2× | 🍋 3× | 🔔 5× | ⭐ 10× | 💎 20× | 7️⃣ 50× (applies to 3-of-a-kind).',
      'The reels are independent — each symbol is picked fresh every spin.',
      'Example: $10 bet, three 🔔 appear → win $50 (5× $10).',
    ],
  },
  'dice-21': {
    title: 'How to Play Dice 21',
    points: [
      'Place your bet and click DEAL — you receive 2 dice to start.',
      'Click ROLL to add another die to your total. You can roll as many times as you like.',
      'Click STAND when you are happy with your total — the house then reveals its dice.',
      'Closest to 21 without going over wins. Going over 21 = Bust = you lose immediately.',
      'House draws until it reaches 17 or more. Win pays 2× bet. Tie (Push) returns your bet.',
      'Example: $10 bet, you total 18, house totals 16 → you win $20.',
    ],
  },
  parity: {
    title: 'How to Play Parity',
    points: [
      'Predict whether 4 randomly drawn numbers (each 0–9) will sum to an Even or Odd total.',
      'Click EVEN or ODD to make your prediction, set your bet, and click Bet.',
      'Four numbers are drawn. They are added together — the parity of the sum is the result.',
      'Correct prediction pays 1.95× your bet (e.g. $10 bet → $19.50 returned, $9.50 profit).',
      'Wrong prediction = you lose your bet. The chance of each outcome is near 50/50.',
      'Example: numbers drawn are 3, 7, 2, 6 → sum 18 → EVEN wins.',
    ],
  },
  'dice-duel': {
    title: 'How to Play Dice Duel',
    points: [
      'Place your bet and click ROLL — you and the house each roll two dice.',
      'Whoever has the higher total wins. Ties are a push — your bet is returned.',
      'Win pays 1.9× your bet (e.g. $10 bet → $19 returned, $9 profit).',
      'Each die shows 1–6, so totals range from 2 to 12.',
      'The house has no advantage beyond the payout rate — it is a pure head-to-head roll.',
      'Example: you roll 9, house rolls 7 → you win $19 on a $10 bet.',
    ],
  },
  'color-spin': {
    title: 'How to Play Color Spin',
    points: [
      'Pick a colour (Red, Blue, or Gold) and your bet amount, then click SPIN.',
      'The wheel spins and lands on a colour segment — match your pick to win.',
      'Red covers 50% of the wheel → pays 1.9×. Blue covers 35% → pays 2.5×.',
      'Gold covers only 15% of the wheel → pays 6× your bet.',
      'All three colours have roughly equal expected value — choose your risk preference.',
      'Example: $10 on Gold, wheel lands Gold → win $60 total ($50 profit).',
    ],
  },
  'lucky-7': {
    title: 'How to Play Lucky 7',
    points: [
      'Pick a bet: Under 7 (total ≤ 6), Lucky 7 (total = 7 exactly), or Over 7 (total ≥ 8).',
      'Set your bet and click ROLL — two dice are rolled and their total is shown.',
      'Under 7 pays 2× | Over 7 pays 2× | Lucky 7 pays 5× your bet.',
      'Lucky 7 is the rarest outcome but rewards the most when it hits.',
      'Under and Over each cover 15 of 36 possible outcomes (~41.7% chance each).',
      'Example: $10 on Lucky 7, dice roll 3+4 = 7 → win $50.',
    ],
  },
  'card-flip': {
    title: 'How to Play Card Flip',
    points: [
      'Three cards are placed face-down. One of them is the Ace of Spades.',
      'Click DEAL — then click any card to flip it over.',
      'If you chose the Ace, you win 2.7× your bet (e.g. $10 bet → $27 returned).',
      'If you chose a non-Ace card, you lose your bet. All cards are revealed afterward.',
      'You have a 1-in-3 (33.3%) chance of finding the Ace each round.',
      'Example: $25 bet, pick the Ace → receive $67.50 ($42.50 profit).',
    ],
  },
  penalty: {
    title: 'How to Play Penalty Shoot',
    points: [
      'Five goal zones are shown. Click PLAY to start, then click a zone to shoot.',
      'The keeper randomly blocks 3 of the 5 zones — if your zone is open, it\'s a GOAL!',
      'A goal pays 2.3× your bet (e.g. $10 bet → $23 returned, $13 profit).',
      'If the keeper blocks your chosen zone, the shot is saved and you lose your bet.',
      'Win probability is approximately 40% per shot (2 of 5 zones are open).',
      'Example: $10 bet, shoot Top Right, keeper leaves it open → win $23.',
    ],
  },
  'hot-dice': {
    title: 'How to Play Hot Dice',
    points: [
      'Place your bet and click ROLL DIE — a single die (1–6) is rolled each time.',
      'Rolling 2, 4, 5, or 6 is safe: your multiplier climbs with each safe roll.',
      'Rolling a 1 or 3 ends the round immediately — you BUST and lose your bet.',
      'Bust chance is 2-in-6 (≈33%) per roll — higher risk, higher reward.',
      'Click CASH OUT at any time after at least one safe roll to collect your winnings.',
      'Multiplier ladder: Roll 1 = 1.3× · Roll 2 = 1.7× · Roll 3 = 2.2× · Roll 4 = 2.9× · Roll 5 = 3.8× …',
      'Example: $10 bet, 3 safe rolls (2.2×) → cash out → receive $22.',
    ],
  },
  'number-match': {
    title: 'How to Play Number Match',
    points: [
      'Pick exactly 3 numbers from 1–9, then click CONFIRM PICKS.',
      'The house draws 3 numbers at random. Count how many of your picks match.',
      '3 matches → 20× bet (jackpot!) | 2 matches → 3× bet | 1 match → 0.5× (partial return).',
      '0 matches = you lose your bet.',
      'Each number can only appear once in the house draw — no duplicates.',
      'Example: $10 bet, pick 2-5-8, house draws 2-5-3 → 2 matches → win $30.',
    ],
  },
  'rapid-roulette': {
    title: 'How to Play Rapid Roulette',
    points: [
      'Choose a bet type: Red, Black, Even, Odd, Low (1–18), High (19–36), or Green Zero.',
      'Set your bet amount and click SPIN — the wheel lands on a random number (0–36).',
      'Red/Black/Even/Odd/Low/High all pay 1.9× your bet.',
      'Green Zero (0) pays 35× your bet but has only a 1-in-37 chance of landing.',
      'Zero beats all other bets except a direct Zero bet.',
      'Example: $10 on Red, wheel lands on Red 14 → win $19 total ($9 profit).',
    ],
  },
  'jackpot-box': {
    title: 'How to Play Jackpot Box',
    points: [
      'Place your bet and click OPEN — 6 mystery boxes appear on screen.',
      'Click one box to open it. The prize inside is immediately revealed.',
      'One box contains the Jackpot (10× bet). Three boxes are empty (lose bet).',
      'The remaining two boxes have small prizes: 0.8×, 0.5×, or 0.3× your bet.',
      'All boxes are revealed after you pick — you\'ll see what you missed!',
      'Example: $10 bet, open the Jackpot box → win $100 (10× $10).',
    ],
  },
  'slot-joker': {
    title: 'How to Play Slot Joker',
    points: [
      'Set your bet and click SPIN — three reels spin independently.',
      'Match all 3 symbols on the centre pay line to win.',
      'The Joker (🃏) is WILD and substitutes for any other symbol.',
      '3 Jokers pays 50× | 7️⃣ 20× | 💎 12× | ⭐ 6× | 🔔 4× | 🍒 3× | 🍋/🍇 2× your bet.',
      'A Joker plus any pair gives the same payout as three-of-a-kind for that symbol.',
      'Example: $10 bet, reels land 🃏 🔔 🔔 → two Joker wilds → win $40 (4× $10).',
    ],
  },
};

export default function GameRules({ gameId, variant = 'accordion' }: { gameId: string; variant?: 'accordion' | 'side' }) {
  const entry = GAME_RULES[gameId];
  if (!entry) return null;
  const { title, points } = entry;

  if (variant === 'side') {
    return (
      <div className="glass-effect border border-accent/20 rounded-xl p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-accent/10">
          <HelpCircle className="h-4 w-4 text-accent shrink-0" />
          <span className="text-sm font-bold text-foreground">{title}</span>
        </div>
        <div className="space-y-3 flex-1">
          {points.map((point, i) => (
            <p key={i} className="text-xs text-muted-foreground flex gap-2 leading-relaxed">
              <span className="text-accent shrink-0 font-bold">{i + 1}.</span>
              <span>{point}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }

  // accordion variant — always visible, no toggle needed
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-8 mt-4">
      <div className="glass-effect border border-accent/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold text-foreground">{title}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
          {points.map((point, i) => (
            <p key={i} className="text-xs text-muted-foreground flex gap-2 leading-relaxed">
              <span className="text-accent shrink-0 font-bold mt-px">{i + 1}.</span>
              <span>{point}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
