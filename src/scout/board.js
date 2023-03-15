/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import { useState } from 'react';
import './board.css';

function CurrentSet({G, ctx, matchData, playerID, checked, setChecked, scouted, setScouted, phase, setPhase, isActive}) {
  let cards = [];
  const clickFunctionGenerator = (index) => {
    return () => {
      if (isActive && ctx.numMoves == 0) {
        if (index == scouted) {
          onCancel();
        } else if (index == G.currentSet.length - 1 || index == 0) {
          setScouted(index);
          setPhase(phases.scouting);
        }
      }
    };
  };
  G.currentSet.forEach((card, index) => {
    var isScoutedCard = index == scouted;
    var className = "card";
    if (isScoutedCard) {
      className += " selected";
    }
    cards.push(<div
    key={"current" + index}
    onClick={clickFunctionGenerator(index)}
    className={className}
    >
      <p className='top'>{card.top}</p>
      <p>{card.bottom}</p>
    </div>);
  });
  const handleChange = () => {
    setChecked(!checked);
  };
  const onCancel = () => {
    setScouted(undefined);
    setPhase(phases.default);
  }

  return (
    <div className='currentSet'>
      <div>
      {cards}
      </div>
      <label>
      <input disabled={!G.tokens[playerID]} type="checkbox" checked={checked} onChange={handleChange}/>
      Scout and Show
      </label>
      <button
        disabled={phase != phases.scouting}
      >Cancel</button>
    </div>
  );
}

var handTypes = {
  duplicate: "duplicate",
  ascending: "ascending",
  descending: "descending"
}
function validateNewSet(leftCard, rightCard, type) {
  if (type == "duplicate") {
    return leftCard.top == rightCard.top;
  } else if (type == "ascending") {
    return leftCard.top + 1 == rightCard.top;
  } else {
    return leftCard.top - 1 == rightCard.top;
  }
}

function determineSetType(leftCard, rightCard) {
  if (leftCard.top == rightCard.top) {
    return handTypes.duplicate;
  } else if (leftCard.top + 1 == rightCard.top) {
    return handTypes.ascending;
  } else if (leftCard.top - 1 == rightCard.top) {
    return handTypes.descending;
  } else {
    return null;
  }
}

function getLargest(set) {
  var largest = 0;
  set.forEach((card) => {
    if (card.top > largest) {
      largest = card.top;
    }
  })
  return largest;
};

function validateShowable(currentSet, currentSetIsDuplicates, showData, hand) {
  if (!showData || !hand) {
    return false;
  }
  if (!currentSet || currentSet.length == 0) {
    if (showData && showData.count && showData.count > 0) {
      return true;
    } else {
      return false;
    }
  }
  if (currentSet.length < showData.count) {
    return true;
  } else if (currentSet.length == showData.count) {
    if (showData.type == handTypes.duplicate && !currentSetIsDuplicates) {
      return true;
    }
    if (showData.type != handTypes.duplicate && currentSetIsDuplicates) {
      return false;
    }
    if (showData.type == handTypes.duplicate) {
      return hand[showData.start].top > currentSet[0].top;
    } else {
      var currentLargest = getLargest(currentSet);
      var largestCardLocation = showData.type == handTypes.ascending ? showData.start + (showData.count - 1) : showData.start;
      var newSetLargest = hand[largestCardLocation].top;
      return newSetLargest > currentLargest;
    }
  }

  return false;
}

function MiniMap({G, playerID, uxOption}) {
  if (uxOption == uxOptions.desktop) {
    return null;
  }

  let cards = [];
  let playerHand = G.hands[playerID];
  playerHand.forEach((card, index) => {
    var className = "minimap-card";
    cards.push(<div
    key={"minimap" + index}
    className={className}
    >
      {card.top}
    </div>);
  });
  return (
  <div>
    Minimap
    <div className="minimap">
      {cards}
    </div>
  </div>);
}

function Hand({G, moves, isActive, playerID, phase, setPhase, checked, scouted, showData, setShowData, setScouted, uxOption}) {
  let cards = [];
  let playerHand = G.hands[playerID];
  const destinationClickGenerator = (index, flip) => {
    return () => {
      moves.scout(scouted, index, flip, checked);
      cancel();
    }
  };
  const showClickGenerator = (index, showing) => {
    return () => {
    if (!isActive) {
      return;
    }
    if (showing) {
      if (showData.count == 1) {
        cancel();
      } else if (index == showData.start) {
        setShowData({
          start: showData.start + 1,
          count: showData.count - 1,
          type: showData.type
        });
      } else if (index == showData.start + (showData.count - 1)) {
        setShowData({
          start: showData.start,
          count: showData.count - 1,
          type: showData.type
        });
      } else {
        cancel();
      }
    } else {
      if (!showData) {
        setShowData({
          start: index,
          count: 1,
          type: null
        });
      } else if (index == showData.start - 1) {
        // if existing pattern check that pattern
        // else check if any pattern fits
        // if not set show data
        if (showData.count == 1) {
          var setType = determineSetType(playerHand[index], playerHand[index + 1]);
          if (setType) {
            setShowData({
              start: index,
              count: showData.count + 1,
              type: setType
            });
          } else {
            setShowData({
              start: index,
              count: 1,
              type: null
            });
          }
        } else {
          if (validateNewSet(playerHand[index], playerHand[index + 1], showData.type)) {
            setShowData({
              start: index,
              count: showData.count + 1,
              type: showData.type 
            })
          } else {
            setShowData({
              start: index,
              count: 1,
              type: null
            });
          }
        }
      } else if (index == showData.start + showData.count) {
        if (showData.count == 1) {
          var setType = determineSetType(playerHand[index - 1], playerHand[index]);
          if (setType) {
            setShowData({
              start: showData.start,
              count: showData.count + 1,
              type: setType
            });
          } else {
            setShowData({
              start: index,
              count: 1,
              type: null
            });
          }
        } else {
          if (validateNewSet(playerHand[index - 1], playerHand[index], showData.type)) {
            setShowData({
              start: showData.start,
              count: showData.count + 1,
              type: showData.type 
            })
          } else {
            setShowData({
              start: index,
              count: 1,
              type: null
            });
          }
        }
      } else {
        setShowData({
          start: index,
          count: 1
        });
      }
      setPhase(phases.showing);
    }
  }
  }
  const cancel = () => {
    setPhase(phases.default);
    setShowData(undefined);
    setScouted(undefined);
  }
  const show = () => {
    moves.show(showData.start, showData.count, showData.type == handTypes.duplicate);
    cancel();
  }
  playerHand.forEach((card, index) => {
    if (phase == phases.scouting) {
      cards.push(<div
        key={"hand-destination" + index}
        className="card"
        >
          <button onClick={destinationClickGenerator(index, false)}>
            Use {G.currentSet[scouted].top}
          </button>
          <button onClick={destinationClickGenerator(index, true)}>
            Use {G.currentSet[scouted].bottom}
          </button>
        </div>);    
    }
    var showing = showData && showData.start !== undefined && index >= showData.start && index < showData.start + showData.count ? true : false;
    var className = "card";
    if (showing) {
      className += " selected";
    }
    cards.push(<div
    key={"hand" + index}
    className={className}
    onClick={showClickGenerator(index, showing)}
    >
      <p className='top'>{card.top}</p>
      <p>{card.bottom}</p>
    </div>);

  });
  if (phase == phases.scouting) {
    cards.push(<div
      key={"hand-destination" + playerHand.length}
      className="card"
      >
        <button onClick={destinationClickGenerator(playerHand.length, false)}>
          Use {G.currentSet[scouted].top}
        </button>
        <button onCLick={destinationClickGenerator(playerHand.length, true)}>
          Use {G.currentSet[scouted].bottom}
        </button>
      </div>);    
  }
  let showable = validateShowable(G.currentSet, G.currentSetIsDuplicates, showData, playerHand);
  let handClassName = "hand " + uxOption;
  return (
    <div>
      <div className={handClassName}>
        {cards}
      </div>
      <button disabled={!showable} onClick={show}>Show</button>
      <button disabled={phase != phases.showing} onClick={cancel}>Cancel</button>
    </div>
  );
}

function Scoreboard({G, ctx, matchData}) {
  let players = [];
  matchData.forEach(({id, name}) => {
    players.push(<div
      key={"other" + id}
      className="scoreboard-card">
        <div>{name}</div>
        <div>cards: {G.hands[id].length}</div>
        <div>points: {G.points[id]}</div>
      </div>);
  });

  let turn;
  if (matchData[ctx.currentPlayer]) {
    turn  = 
    <p>{matchData[ctx.currentPlayer].name}'s turn</p>
    ;
  }

  if (ctx.gameover) {
    turn = <p>Game Over</p>
  }

  let setOwner = null;
  if (G.setOwner) {
    setOwner = <div>Set owner: {matchData[G.setOwner].name}</div>;
  }
  return (
    <div>
    <div className="scoreboard">
      {players}
    </div>
    {turn}
    {setOwner}
    </div>
  );
}

function UxSelector({setUxOption}) {
  return (
    <div className='uxselector'>
      <p>Select a UX style for your hand</p>
      <button onClick={() => {setUxOption(uxOptions.horizontalScroll)}}>Horizontal Scroll</button>
      <button onClick={() => {setUxOption(uxOptions.vertical)}}>Vertical Scroll</button>
      <button onClick={() => {setUxOption(uxOptions.desktop)}}>Desktop</button>
    </div>
  )
}

var phases = {
  default: "default",
  scouting: "scouting",
  showing: "showing"
}

var uxOptions = {
  desktop: "desktop",
  vertical: "vertical",
  horizontalScroll: "horizontalScroll"
}

export default function ScoutBoard(props) {
  const {
    G, ctx, moves, playerID, isActive, isMultiplayer, isConnected, isPreview, events, matchData
  } = props;
  let [phase, setPhase] = useState(phases.showing);
  let [showData, setShowData] = useState(undefined);
  let [scouted, setScouted] = useState(undefined);
  let [checked, setChecked] = useState(false);
  let [uxOption, setUxOption] = useState(uxOptions.horizontalScroll);

  const currentSetProps = {G, playerID, ctx, checked, matchData, setChecked, scouted, setScouted, phase, setPhase, isActive};
  const handProps = {G, isActive, moves, playerID, events, phase, setPhase, checked, scouted, showData, setShowData, setScouted, uxOption};
  const otherPlayersProps = {G, ctx, playerID, matchData}
  const minimapProps = {G, playerID, uxOption};
  return (
    <div>
      <Scoreboard
        {...otherPlayersProps}
      ></Scoreboard>
      <CurrentSet
        {...currentSetProps}
      ></CurrentSet>
      <MiniMap {...minimapProps}></MiniMap>
      <Hand
        {...handProps}
      ></Hand>
      <UxSelector setUxOption={setUxOption}></UxSelector>
    </div>
  );
}