// packages/database/src/index.ts
export * from "./schema";
export { db, migrationClient } from "./client";

// Comparison operators
export {
  eq, // equal
  ne, // not equal
  gt, // greater than
  gte, // greater than or equal
  lt, // less than
  lte, // less than or equal
} from "drizzle-orm";

// Pattern matching
export {
  like, // SQL LIKE
  ilike, // case insensitive LIKE
} from "drizzle-orm";

// Null checks
export { isNull, isNotNull } from "drizzle-orm";

// Array operations
export {
  inArray, // WHERE id IN (1,2,3)
  notInArray, // WHERE id NOT IN (1,2,3)
} from "drizzle-orm";

// Logical operators
export {
  and, // WHERE x AND y
  or, // WHERE x OR y
  not, // WHERE NOT x
} from "drizzle-orm";

// Sorting
export {
  asc, // ORDER BY x ASC
  desc, // ORDER BY x DESC
} from "drizzle-orm";

// Aggregations
export { count, sum, avg, min, max } from "drizzle-orm";
