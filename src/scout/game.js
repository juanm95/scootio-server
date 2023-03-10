function flipCard(card) {
  var temp = card.bottom;
  card.bottom = card.top;
  card.top = temp;
}

function scout({G, playerID}, index, destination, flip, scoutAndShow) {
  G.points[G.setOwner]++;
  var scoutedCard = G.currentSet.splice(index, 1);
  if (flip) flipCard(scoutedCard);
  G.hands[playerID].splice(index, 0, scoutedCard);
  if (scoutAndShow) {
    G.tokens[playerID] = false;
  } else {
    events.endTurn();
  }
}

function show({G, playerId, events}, start, amount) {
  G.points[playerId] += currentSet.length;
  G.currentSet = G.hands[playerId].splice(start, amount);
  G.setOwner = playerId;
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
}

function onPhaseEnd({G, ctx, events}) {
  if (G.round == ctx.playOrder.length) {
    events.endGame();
  } else {
    G.round++;
  }
  events.endTurn({ next: ctx.playOrder[++G.round]});
}

function endIf({G, ctx}) {
  if (ctx.currentPlayer != G.setOwner) {
    G.checkRotation = true;
  } else if (G.checkRotation) {
    return true;
  }
  return G.hands[ctx.currentPlayer].length == 0;
}

var turn = {
  minMoves: 1,
  maxMoves: 2
}

const Scout = {
  name: 'scout',

  setup: ({ctx}) => ({
    hands: initHands(ctx),
    points: initPoints(ctx),
    tokens: initTokens(ctx),
    currentSet: undefined,
    setOwner: undefined,
    round: 0,
    checkRotation: false,
  }),

  phases: {
    round1: {
      start: true,
      next: "round2",
      moves: {
        scout,
        show
      },
      turn: turn,
      onEnd: onPhaseEnd,
      endIf
    },
    round2: {
      next: "round3",
      moves: {
        scout,
        show
      },
      turn: turn,
      onEnd: onPhaseEnd,
      endIf
    },
    round3: {
      moves: {
        scout,
        show
      },
      turn: turn,
      onEnd: onPhaseEnd,
      endIf
    }
  }
};

export default Scout;
