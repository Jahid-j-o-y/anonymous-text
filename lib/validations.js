import { z } from "zod";

export const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(usernameRegex, "Username can only contain letters, numbers, and underscores"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Username or email is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const sendMessageSchema = z.object({
  recipientUsername: z
    .string()
    .trim()
    .min(3, "Recipient username must be at least 3 characters")
    .max(50, "Recipient username cannot exceed 50 characters")
    .regex(usernameRegex, "Invalid username format"),
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(500, "Message content cannot exceed 500 characters"),
});

export const replyMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Reply content is required")
    .max(500, "Reply content cannot exceed 500 characters"),
});

export const reportMessageSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(255, "Reason cannot exceed 255 characters"),
  alsoBlockSender: z.boolean().optional().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirmation password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export const adminReportActionSchema = z.object({
  action: z.enum(["dismiss", "delete_message", "block_sender"]),
});

