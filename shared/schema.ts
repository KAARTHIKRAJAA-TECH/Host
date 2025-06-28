import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Add custom timestamp type for SQLite compatibility
const timestamp = (name: string) => {
  return text(name);
};

const serial = (name: string) => {
  return integer(name, { mode: 'number' });
};

const boolean = (name: string) => {
  return integer(name, { mode: 'boolean' });
};

// Helper for timestamp defaults
const currentTimestamp = sql`CURRENT_TIMESTAMP`;

// Users table
export const users = sqliteTable("users", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user").notNull(), // "user" or "admin"
  createdAt: timestamp("created_at").default(currentTimestamp).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  licenseRequests: many(licenseRequests, { relationName: "requester" }),
  receivedRequests: many(licenseRequests, { relationName: "owner" }),
}));

// Posts table (content)
export const posts = sqliteTable("posts", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  licenseType: text("license_type").notNull(), // "free", "paid", "permission", "none"
  allowDownload: boolean("allow_download").default(false),
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  contentType: text("content_type").notNull(),
  contentHash: text("content_hash").notNull().unique(),
  price: integer("price"), // For paid content
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").default(currentTimestamp).notNull(),
  updatedAt: timestamp("updated_at").default(currentTimestamp).notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  owner: one(users, { fields: [posts.ownerId], references: [users.id] }),
  licenseRequests: many(licenseRequests),
}));

// License requests table
export const licenseRequests = sqliteTable("license_requests", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  postId: integer("post_id").references(() => posts.id).notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(), // "pending", "approved", "rejected"
  createdAt: timestamp("created_at").default(currentTimestamp).notNull(),
  updatedAt: timestamp("updated_at"),
});

export const licenseRequestsRelations = relations(licenseRequests, ({ one }) => ({
  post: one(posts, { fields: [licenseRequests.postId], references: [posts.id] }),
  requester: one(users, { fields: [licenseRequests.requesterId], references: [users.id], relationName: "requester" }),
  owner: one(users, { fields: [licenseRequests.ownerId], references: [users.id], relationName: "owner" }),
}));

// Comments table
export const comments = sqliteTable("comments", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(currentTimestamp).notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

// Likes table
export const likes = sqliteTable("likes", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(currentTimestamp).notNull(),
});

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
  user: one(users, { fields: [likes.userId], references: [users.id] }),
}));

// Schema for user insertion and validation
export const userInsertSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
});
export type UserInsert = z.infer<typeof userInsertSchema>;

// Schema for post insertion and validation
export const postInsertSchema = createInsertSchema(posts, {
  title: (schema) => schema.min(1, "Title is required"),
  licenseType: (schema) => schema.refine(
    val => ["free", "paid", "permission", "none"].includes(val), 
    "Invalid license type"
  ),
});
export type PostInsert = z.infer<typeof postInsertSchema>;

// Schema for license request insertion and validation
export const licenseRequestInsertSchema = createInsertSchema(licenseRequests);
export type LicenseRequestInsert = z.infer<typeof licenseRequestInsertSchema>;

// Schema for updating license request status
export const updateLicenseRequestSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    required_error: "Status must be either approved or rejected",
  }),
});
export type UpdateLicenseRequest = z.infer<typeof updateLicenseRequestSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// User type with select fields
export const userSelectSchema = createSelectSchema(users);
export type User = z.infer<typeof userSelectSchema>;

// Post type with select fields
export const postSelectSchema = createSelectSchema(posts);
export type Post = z.infer<typeof postSelectSchema>;

// License request type with select fields
export const licenseRequestSelectSchema = createSelectSchema(licenseRequests);
export type LicenseRequest = z.infer<typeof licenseRequestSelectSchema>;

// Delete requests table
export const deleteRequests = sqliteTable("delete_requests", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reason: text("reason"),
  status: text("status").default("pending").notNull(), // "pending", "approved", "rejected"
  createdAt: timestamp("created_at").default(currentTimestamp).notNull(),
  updatedAt: timestamp("updated_at"),
});

export const deleteRequestsRelations = relations(deleteRequests, ({ one }) => ({
  post: one(posts, { fields: [deleteRequests.postId], references: [posts.id] }),
  user: one(users, { fields: [deleteRequests.userId], references: [users.id] }),
}));

// Schema for delete request insertion and validation
export const deleteRequestInsertSchema = createInsertSchema(deleteRequests);
export type DeleteRequestInsert = z.infer<typeof deleteRequestInsertSchema>;

// Schema for updating delete request status
export const updateDeleteRequestSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    required_error: "Status must be either approved or rejected",
  }),
});
export type UpdateDeleteRequest = z.infer<typeof updateDeleteRequestSchema>;

// Delete request type with select fields
export const deleteRequestSelectSchema = createSelectSchema(deleteRequests);
export type DeleteRequest = z.infer<typeof deleteRequestSelectSchema>;
