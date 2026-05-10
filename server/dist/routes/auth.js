"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middleware/validateRequest");
const router = express_1.default.Router();
router.post('/register', validateRequest_1.validateRegister, validateRequest_1.handleValidationErrors, authController_1.register);
router.post('/login', validateRequest_1.validateLogin, validateRequest_1.handleValidationErrors, authController_1.login);
exports.default = router;
