import * as z from "zod";

export const PasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Password should be more than 6 characters",
  }),
});