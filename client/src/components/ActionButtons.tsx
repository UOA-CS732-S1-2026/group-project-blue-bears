import React, { useEffect, useState } from "react";
import "./ActionButtons.css";

interface ActionButtonsProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onPlayAgain, onMainMenu }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 750);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`action-buttons ${visible ? "action-buttons--visible" : ""}`}>
      <button
        className="action-btn action-btn--secondary"
        onClick={onPlayAgain}
      >
        <span className="action-btn__label">Play Again</span>
        <span className="action-btn__shine" />
      </button>

      <button
        className="action-btn action-btn--ghost"
        onClick={onMainMenu}
      >
        <span className="action-btn__label">Main Menu</span>
        <span className="action-btn__shine" />
      </button>
    </div>
  );
};

export default ActionButtons;