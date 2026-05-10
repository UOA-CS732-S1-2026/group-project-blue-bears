"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passageController_1 = require("../controllers/passageController");
const router = (0, express_1.Router)();
router.get("/", passageController_1.getRandomPassage);
exports.default = router;
