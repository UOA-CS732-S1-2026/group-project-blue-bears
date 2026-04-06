import express from 'express';
import { register, login } from '../controllers/authController';
import {
    validateRegister,
    validateLogin,
    handleValidationErrors
} from '../middleware/validateRequest';

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);

export default router;