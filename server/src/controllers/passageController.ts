import { Request, Response } from "express";

const words: string[] = require("../data/commonWords.json");

export const getRandomPassage = (_req: Request, res: Response) => {
  try {
    const count = 50;
    const selected: string[] = [];

    for (let i = 0; i < count; i++) {
      const random = words[Math.floor(Math.random() * words.length)];
      selected.push(random);
    }

    const text = selected.join(" ");

    return res.json({
      text,
      length: text.length,
      source: "local-wordlist"
    });
  } catch (error) {
    console.error("Local word generation error:", error);
    return res.status(500).json({ error: "Unable to generate text" });
  }
};
