import React from 'react';
import {useEffect} from 'react';
import { Lobby } from 'boardgame.io/react';
import Scout from './scout/game';
import ScoutBoard from './scout/board';

const { protocol, hostname, port } = window.location;
const server = `${protocol}//${hostname}:${port}`;
const importedGames = [{game: Scout, board: ScoutBoard}];

export default () => {
  
  useEffect(() => {
    document.getElementById("lobby-view").style = undefined;
  }, []);

  return (
  <div>
    <Lobby gameServer={server} lobbyServer={server} gameComponents={importedGames} />
  </div>
)};