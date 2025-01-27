// server.js

import { Server, Origins } from 'boardgame.io/server';
import path from 'path';
import serve from 'koa-static';
import TicTacToe from './tic-tac-toe/game';
import Scout from './scout/game';

const server = Server({ games: [TicTacToe, Scout], origins: [
    Origins.LOCALHOST,
    "https://scootio-server.onrender.com"
] });
const PORT = process.env.PORT || 8000;

// Build path relative to the server.js file
const frontEndAppBuildPath = path.resolve(__dirname, '../build');
server.app.use(serve(frontEndAppBuildPath))

server.run(PORT, () => {
  server.app.use(
    async (ctx, next) => await serve(frontEndAppBuildPath)(
      Object.assign(ctx, { path: 'index.html' }),
      next
    )
  );
});