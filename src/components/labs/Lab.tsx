import { useState, useEffect } from "react";
import GameOfLife from "./game-of-life/GameOfLife";
import ConnectFour from "./connect-four/ConnectFour";
import Snake from "./snake/Snake";
import Boop from "./boop/Boop";
import LabDescription from "./LabDescription";
import c4Md from "./connect-four/connect-four.md?raw";
import snakeMd from "./snake/snake.md?raw";
import boopMd from "./boop/boop.md?raw";
import "./Lab.css";

type Game = "gol" | "c4" | "snake" | "boop";

function initialGame(): Game {
  const h = window.location.hash;
  if (h === "#lab-c4")    return "c4";
  if (h === "#lab-snake") return "snake";
  if (h === "#lab-boop")  return "boop";
  return "gol";
}

export default function Lab() {
  const [activeGame, setActiveGame] = useState<Game>(initialGame);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#lab-c4")     setActiveGame("c4");
      else if (window.location.hash === "#lab-gol")   setActiveGame("gol");
      else if (window.location.hash === "#lab-snake") setActiveGame("snake");
      else if (window.location.hash === "#lab-boop")  setActiveGame("boop");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <section id="lab" className="gol-section section">
      <div className="section-inner">
        <h2 className="section-title gol-title">
          Demo <span className="gradient-text">Lab</span>
        </h2>

        <div className="lab-tabs">
          <button
            className={`lab-tab${activeGame === "gol" ? " active" : ""}`}
            onClick={() => setActiveGame("gol")}
          >
            Game of Life
          </button>
          <button
            className={`lab-tab${activeGame === "c4" ? " active" : ""}`}
            onClick={() => setActiveGame("c4")}
          >
            Connect Four
          </button>
          <button
            className={`lab-tab${activeGame === "snake" ? " active" : ""}`}
            onClick={() => setActiveGame("snake")}
          >
            Snake
          </button>
          <button
            className={`lab-tab${activeGame === "boop" ? " active" : ""}`}
            onClick={() => setActiveGame("boop")}
          >
            Boop
          </button>
        </div>

        {activeGame === "c4"    ? <><ConnectFour /><LabDescription markdown={c4Md} /></> :
         activeGame === "snake" ? <><Snake /><LabDescription markdown={snakeMd} /></> :
         activeGame === "boop"  ? <><Boop /><LabDescription markdown={boopMd} /></> :
         <GameOfLife />}
      </div>
    </section>
  );
}
