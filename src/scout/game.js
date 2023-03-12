function flipCard(card) {
  var temp = card.bottom;
  card.bottom = card.top;
  card.top = temp;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

var cardCount = [0, 0, 44, 45, 44, 45];
var cardsPerPlayer = [0, 0, 11, 15, 11, 9];

function generateCards(players) {
  var cards = [];
  for (var i = 0; i < cardCount[players]; i++) {
    cards.push({
      top: getRandomIntInclusive(1, 10),
      bottom: getRandomIntInclusive(1, 10)
    });
  }
  return cards;
}

function generateHands(ctx) {
  var playerCount = ctx.playOrder.length;
  var hands = {};
  var cards = generateCards(playerCount);
  ctx.playOrder.forEach((playerId) => {
    hands[playerId] = [];
    for(var i = 0; i < cardsPerPlayer[playerCount]; i++) {
      hands[playerId].push(cards.pop());
    }
  });
  return hands;
}

function scout({G, playerID, events}, index, destination, flip, scoutAndShow) {
  G.checkRotation = true;
  G.points[G.setOwner]++;
  var scoutedCard = G.currentSet.splice(index, 1)[0];
  if (G.currentSet.length == 1) {
    G.currentSetIsDuplicates = false;
  }
  if (flip) flipCard(scoutedCard);
  G.hands[playerID].splice(destination, 0, scoutedCard);
  if (scoutAndShow) {
    G.tokens[playerID] = false;
  } else {
    events.endTurn();
  }
}

function show({G, playerID, events}, start, amount, duplicates) {
  G.checkRotation = false;
  G.points[playerID] += G.currentSet.length;
  G.currentSet = G.hands[playerID].splice(start, amount);
  G.currentSetIsDuplicates = duplicates;
  G.setOwner = playerID;
  events.endTurn();
}

function initHands(ctx) {
  var hands = {};
  ctx.playOrder.forEach((playerId) => {
    hands[playerId] = [{
      top: 2, bottom: 1
    },{
      top: 3, bottom: 4
    },
    {
      top: 5, bottom: 6
    }
  ];
  });
  return hands;
}

function initPoints(ctx) {
  var points = {};
  ctx.playOrder.forEach((playerId) => {
    points[playerId] = 0;
  });
  return points;
}

function initTokens(ctx) {
  var tokens = {};
  ctx.playOrder.forEach((playerId) => {
    tokens[playerId] = true;
  });
  return tokens;
}

function onPhaseEnd({G, ctx, events}) {
  if (G.round == ctx.playOrder.length) {
    events.endGame();
  }
}

function endIf({G, ctx}) {
  let shouldEnd = false;
  if (G.checkRotation && G.setOwner == ctx.currentPlayer) {
    shouldEnd = true;
  }
  if (G.hands[ctx.currentPlayer].length == 0) {
    shouldEnd = true;
  }
  if (shouldEnd) {
    return { next: ctx.playOrder[++G.round] };
  }
  return false;
}

var turn = {
  minMoves: 1,
  maxMoves: 2
}

const Scout = {
  name: 'scout',

  setup: ({ctx}) => ({
    hands: generateHands(ctx),
    points: initPoints(ctx),
    tokens: initTokens(ctx),
    currentSet: [],
    currentSetIsDuplicates: undefined,
    setOwner: undefined,
    round: 0,
    checkRotation: false,
  }),

  moves: {
    scout, show
  },

  phases: {
    round1: {
      start: true,
      next: "round2",
      turn: turn,
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show
      }
    },
    round2: {
      next: "round3",
      turn: turn,
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show
      }
    },
    round3: {
      turn: turn,
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show
      }
    }
  }
};

export default Scout;
