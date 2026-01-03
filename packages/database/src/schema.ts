import { pgTable, serial, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// Users Table
// ============================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Zod Schemas - Auto Generated
// ============================================

// Schema insert (new user)
export const insertUserSchema = createInsertSchema(users, {
  email: z.email("ایمیل نامعتبر است"),
  name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  password: z.string().min(8, "رمز عبور باید حداقل 8 کاراکتر باشد"),
});

// Schema select (user)
export const selectUserSchema = createSelectSchema(users);

// ============================================
// Custom Zod Schemas
// ============================================

// Signup Schema
export const registerUserSchema = z.object({
  name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(8, "رمز عبور باید حداقل 8 کاراکتر باشد"),
});
// Schema برای آپدیت (همه فیلدها optional)
export const updateUserSchema = insertUserSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Login Schema
export const loginUserSchema = z.object({
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

// ============================================
// TypeScript Types
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
