import React, { useState, useRef, useEffect } from "react";
import TypingDisplay from "../components/TypingDisplay";
import "./GamePage.css";

const PASSAGE =
  "The journey of a thousand miles begins with a single step. Similarly, mastering typing starts with learning proper finger placement on the keyboard.";
 
const GamePage: React.FC = () => {
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
 
  // Auto-focus the hidden input when the page loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
 
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= PASSAGE.length) {
      setUserInput(val);
    }
  };
 
  return (
    <div
      className="game-page"
      onClick={() => inputRef.current?.focus()} 
    >
      <input
        ref={inputRef}
        value={userInput}
        onChange={handleInput}
        className="game-page__hidden-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
 
      <TypingDisplay passage={PASSAGE} userInput={userInput} />
    </div>
  );
};
 
export default GamePage;