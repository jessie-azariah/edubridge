import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Users & sessions (simple registration + auth)
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"), // student | educator | admin
  school: varchar("school", { length: 160 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 64 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Learning resources (past papers, notes, schemes of work, etc.)
// ---------------------------------------------------------------------------
export const resources = pgTable(
  "resources",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    subject: varchar("subject", { length: 80 }).notNull(),
    level: varchar("level", { length: 40 }).notNull(),
    fileUrl: varchar("file_url", { length: 320 }).notNull(),
    fileName: varchar("file_name", { length: 200 }).notNull(),
    fileSize: integer("file_size").notNull().default(0), // bytes
    fileType: varchar("file_type", { length: 60 }).notNull().default(
      "application/octet-stream",
    ),
    downloads: integer("downloads").notNull().default(0),
    avgRating: real("avg_rating").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("approved"), // pending | approved
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    subjectIdx: index("resources_subject_idx").on(t.subject),
    levelIdx: index("resources_level_idx").on(t.level),
    createdIdx: index("resources_created_idx").on(t.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Comments (community feedback on a resource)
// ---------------------------------------------------------------------------
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ resourceIdx: index("comments_resource_idx").on(t.resourceId) }),
);

// ---------------------------------------------------------------------------
// Q&A forum (academic discussions)
// ---------------------------------------------------------------------------
export const forumTopics = pgTable(
  "forum_topics",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    subject: varchar("subject", { length: 80 }).notNull(),
    level: varchar("level", { length: 40 }).notNull().default("general"),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ createdIdx: index("forum_created_idx").on(t.createdAt) }),
);

export const forumReplies = pgTable(
  "forum_replies",
  {
    id: serial("id").primaryKey(),
    topicId: integer("topic_id")
      .notNull()
      .references(() => forumTopics.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isAccepted: boolean("is_accepted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ topicIdx: index("replies_topic_idx").on(t.topicId) }),
);

// ---------------------------------------------------------------------------
// Tipping (Mobile Money support for educators)
// ---------------------------------------------------------------------------
export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  toUserId: integer("to_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // UGX
  network: varchar("network", { length: 20 }).notNull().default("mtn"), // mtn | airtel
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Favorites & ratings
// ---------------------------------------------------------------------------
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: uniqueIndex("fav_unq").on(t.userId, t.resourceId),
  }),
);

export const ratings = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
  },
  (t) => ({
    unq: uniqueIndex("rating_unq").on(t.userId, t.resourceId),
  }),
);

export type User = typeof users.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type ForumTopic = typeof forumTopics.$inferSelect;
export type ForumReply = typeof forumReplies.$inferSelect;
export type Tip = typeof tips.$inferSelect;
