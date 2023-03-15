import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import { get, isNil } from 'lodash';

import Lobby from './Lobby';
import './App.css';

function App() {
  const [auth, setAuth] = useState({
    playerID: null,
    credentials: null,
    roomID: null,
  });

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Lobby/>}>
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;