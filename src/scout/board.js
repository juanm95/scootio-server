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

function CurrentSet({G, playerID, checked, setChecked, scouted, setScouted, phase, setPhase, isActive}) {
  let cards = [];
  const clickFunctionGenerator = (index) => {
    return () => {
      if (isActive) {
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
    var className = "set-card";
    if (isScoutedCard) {
      className += " scouted";
    }
    cards.push(<td
    key={"current" + index}
    onClick={clickFunctionGenerator(index)}
    className={className}
    >
      top: {card.top}, bottom: {card.bottom}, scouted: {isScoutedCard}
    </td>);
  });
  const handleChange = () => {
    setChecked(!checked);
  };
  const onCancel = () => {
    setScouted(undefined);
    setPhase(phases.default);
  }
  return (
    <div>
      {cards}
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
  if (!currentSet) {
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
      var newSetLargest = hand[largestCardLocation];
      return newSetLargest > currentLargest;
    }
  }

  return false;
}

function Hand({G, playerID, phase, setPhase, checked, scouted, showData, setShowData, events}) {
  let cards = [];
  let playerHand = G.hands[playerID];
  const destinationClickGenerator = (index, flip) => {
    return () => {
      G.moves.scout({G, playerID, events}, scouted, index, flip, checked);
    }
  };
  const showClickGenerator = (index, showing) => {
    return () => {
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
  }
  const show = () => {
    G.moves.show({G, playerID, events}, showData.start, showData.count, showData.type == handTypes.duplicate);
  }
  playerHand.forEach((card, index) => {
    if (phase == phases.scouting) {
      cards.push(<td
        key={"hand-destination" + index}
        className="destination"
        >
          <button onClick={destinationClickGenerator(index, false)}>
            Use {G.CurrentSet[scouted].top}
          </button>
          <button onCLick={destinationClickGenerator(index, true)}>
            Use {G.CurrentSet[scouted].bottom}
          </button>
        </td>);    
    }
    var showing = showData && showData.start && index >= showData.start && index < showData.start + showData.count ? true : false;
    var className = "hand";
    if (showing) {
      className += " showing";
    }
    cards.push(<td
    key={"hand" + index}
    className={className}
    onClick={showClickGenerator(index, showing)}
    >
      top: {card.top}, bottom: {card.bottom}
    </td>);

  });
  let showable = validateShowable();
  return (
    <div>
      {cards}
      <button disabled={!showable} onClick={show}>Show</button>
      <button disabled={phase != phases.showing} onClick={cancel}>Cancel</button>
    </div>
  );
}

function OtherPlayers({G, ctx, playerID}) {
  let otherPlayers = [];
  ctx.playOrder.forEach((playerId) => {
    if (playerId != playerID) {
      otherPlayers.push(<td
      key={"other" + playerId}>
        playerId: {playerId}, cards: {G.hands[playerId].length}
      </td>);
    }
  })

  return (
    <div>
      {otherPlayers}
    </div>
  );
}

var phases = {
  default: "default",
  scouting: "scouting",
  showing: "showing"
}

export default function ScoutBoard({
  G, ctx, moves, playerID, isActive, isMultiplayer, isConnected, isPreview, events
}) {
  let [phase, setPhase] = useState(phases.showing);
  let [showData, setShowData] = useState(undefined);
  let [scouted, setScouted] = useState(undefined);
  let [checked, setChecked] = useState(false);

  const currentSetProps = {G, playerID, checked, setChecked, scouted, setScouted, phase, setPhase, isActive};
  const handProps = {G, playerID, events, phase, setPhase, checked, scouted, showData, setShowData, events};
  return (
    <div>
      <OtherPlayers
        G={G}
        ctx={ctx}
        playerID={playerID}
      ></OtherPlayers>
      <CurrentSet
        {...currentSetProps}
      ></CurrentSet>
      <Hand
        {...handProps}
      ></Hand>
    </div>
  );
}