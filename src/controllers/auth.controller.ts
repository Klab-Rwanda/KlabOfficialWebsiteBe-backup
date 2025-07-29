import { Request, Response } from "express";
import {
  signup,
  signin,
  googleAuthHandler,
  requestPasswordReset,
  resetPassword,
} from "../services/auth.service";
import { Profile } from "passport-google-oauth20";

export const signupController = async (req: Request, res: Response) => {
  try {
    const user = await signup(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const signinController = async (req: Request, res: Response) => {
  try {
    const { token, user } = await signin(req.body.email, req.body.password);
    res.status(200).json({ token, user });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const googleCallbackController = async (req: Request, res: Response) => {
  try {
    const profile = req.user as Profile;
    const { token, user } = await googleAuthHandler(profile);
    res.status(200).json({ token, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    res.status(500).json({ message });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await requestPasswordReset(email);

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Password reset request failed";
    res.status(400).json({ message });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    const result = await resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Password reset failed";

    const statusCode =
      message.includes("expired") || message.includes("Invalid") ? 401 : 400;

    res.status(statusCode).json({ message });
  }
};