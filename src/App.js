import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import ArcheryGame from "./ArcheryGame";
import BlockMinerGame from "./BlockMinerGame";
import OpenCampusCodeQuest from "./OpenCampusCodeQuest";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/archery" element={<ArcheryGame />} />
        <Route path="/block-miner" element={<BlockMinerGame />} />
        <Route path="/code-quest" element={<OpenCampusCodeQuest />} />
      </Routes>
    </Router>
  );
}

export default App;
