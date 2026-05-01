import React, { useMemo } from "react";
import "./TypingDisplay.css";

interface TypingDisplayProps {
  passage: string;       // full text to type
  userInput: string;     // what the user has typed so far
}

type CharState = "correct" | "incorrect" | "pending";

interface CharData {
  char: string;
  state: CharState;
  isCursor: boolean;
}

const TypingDisplay: React.FC<TypingDisplayProps> = ({ passage, userInput }) => {
  const chars: CharData[] = useMemo(() => {
    return passage.split("").map((char, i) => {
      const isCursor = i === userInput.length;
      let state: CharState = "pending";
      if (i < userInput.length) {
        state = userInput[i] === char ? "correct" : "incorrect";
      }
      return { char, state, isCursor };
    });
  }, [passage, userInput]);

  return (
    <div className="typing-display">
      <div className="typing-display__text">
        {chars.map(({ char, state, isCursor }, i) => (
          <span
            key={i}
            className={[
              "typing-display__char",
              `typing-display__char--${state}`,
              isCursor ? "typing-display__char--cursor" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TypingDisplay;