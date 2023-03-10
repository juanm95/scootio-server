import React from 'react';
import { Lobby } from 'boardgame.io/react';
import TicTacToeBoard from './tic-tac-toe/board';
import Scout from './scout/game';
import ScoutBoard from './scout/board';
import TicTacToe from './tic-tac-toe/game';

const { protocol, hostname, port } = window.location;
const server = `${protocol}//${hostname}:${port}`;
const importedGames = [{ game: TicTacToe, board: TicTacToeBoard }, {game: Scout, board: ScoutBoard}];

export default () => (
  <div>
    <h1>Lobby</h1>
    <Lobby gameServer={server} lobbyServer={server} gameComponents={importedGames} />
  </div>
);