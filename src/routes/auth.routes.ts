import { Router } from "express";
import { signupController, signinController, forgotPasswordController, resetPasswordController } from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signupController);
router.post("/google", signupController);
router.post("/signin", signinController);
router.post("/forgot", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;