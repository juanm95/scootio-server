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

var cardCount = [0, 17, 44, 45, 44, 45];
var cardsPerPlayer = [0, 17, 11, 15, 11, 9];

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

function scout({G, playerID, events, ctx}, index, destination, flip, scoutAndShow) {
  G.checkRotation = true;
  if (ctx.numPlayers != 2) {
    G.points[G.setOwner]++;
  }
  var scoutedCard = G.currentSet.splice(index, 1)[0];
  if (G.currentSet.length == 1) {
    G.currentSetIsDuplicates = false;
  }
  if (flip) flipCard(scoutedCard);
  G.hands[playerID].splice(destination, 0, scoutedCard);
  if (scoutAndShow) {
    if (ctx.numPlayers == 2) {
      G.tokens[playerID] -= 1;
    } else {
      G.tokens[playerID] = false;
    }
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

function pass({G, events}) {
  G.checkRotation = true;
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

function calculateRemainingPoints({G, ctx}) {
  var points = {};
  ctx.playOrder.forEach((playerId) => {
    points[playerId] = G.points[playerId];
    if (playerId != G.setOwner) {
      points[playerId]-= G.hands[playerId].length;
    }
    if (ctx.numPlayers == 2) {
      points[playerId] += G.tokens[playerId];
    }
  });
  return points;
}

function initTokens(ctx) {
  var tokens = {};
  if (ctx.playOrder.length == 2) {
    ctx.playOrder.forEach((playerId) => {
      tokens[playerId] = 3;
    });
  } else {
    ctx.playOrder.forEach((playerId) => {
      tokens[playerId] = true;
    });
  }
  return tokens;
}

function onPhaseEnd({G, ctx, events}) {
  if (ctx.phase == `round${ctx.numPlayers}`) {
    events.endGame();
  } else {
    return reshuffleCards({G, ctx});
  }
}

function endIf({G, ctx}) {
  if (ctx.numMoves == 0 || ctx.gameover) {
    return false;
  }
  let shouldEnd = false;
  if (G.checkRotation && G.setOwner == ctx.currentPlayer) {
    shouldEnd = true;
  }
  if (G.hands[ctx.currentPlayer].length == 0) {
    shouldEnd = true;
  }
  if (shouldEnd) {
    return true;
  }
  return false;
}

function createTurn(round) {
  return {
    minMoves: 1,
    maxMoves: 4,
    order: {
      first: ({}) => round - 1,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    }
  }
}

function reshuffleCards({ G, ctx }) {
  return {
    ...G,
    points: calculateRemainingPoints({G, ctx}),
    hands: generateHands(ctx),
    currentSet: [],
    setOwner: undefined,
    currentSetIsDuplicates: undefined,
    checkRotation: false,
    tokens: initTokens(ctx)
  };
}

function endTheGame({G}) {
  return {
    ...G,
    setOwner: undefined,
  }
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
    round: 1,
    checkRotation: false,
  }),

  moves: {
    scout, show, pass
  },

  phases: {
    round1: {
      start: true,
      next: "round2",
      turn: createTurn(1),
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show, pass
      }
    },
    round2: {
      next: "round3",
      turn: createTurn(2),
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show, pass
      }
    },
    round3: {
      next: "round4",
      turn: createTurn(3),
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show
      }
    },
    round4: {
      next: "round5",
      turn: createTurn(4),
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show
      }
    },
    round5: {
      turn: createTurn(5),
      onEnd: onPhaseEnd,
      endIf,
      moves: {
        scout, show
      }
    }
  }
};

export default Scout;
