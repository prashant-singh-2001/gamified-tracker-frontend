import { z } from 'zod';

// Mirrors the gateway DTO validation: @NotBlank names/password, @Email email.
// The backend sets no password length rule, so none is invented here.
const email = z.email('Enter a valid email address');
const required = (label: string) => z.string().trim().min(1, `${label} is required`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: required('First name'),
  lastName: required('Last name'),
  email,
  password: z.string().min(1, 'Password is required'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
