"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomPassage = void 0;
const words = require("../data/commonWords.json");
const getRandomPassage = (_req, res) => {
    try {
        const count = 50;
        const selected = [];
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
    }
    catch (error) {
        console.error("Local word generation error:", error);
        return res.status(500).json({ error: "Unable to generate text" });
    }
};
exports.getRandomPassage = getRandomPassage;
