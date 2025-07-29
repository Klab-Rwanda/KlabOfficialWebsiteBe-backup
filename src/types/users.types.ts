export interface User {
  id?: number;
  full_name: string;
  email: string;
  is_active: boolean;
  role: "user" | "admin";
  password: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}
