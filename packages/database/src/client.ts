import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "redis";
import * as schema from "./schema";
import type { RedisClientType } from "redis";
import { RedisClient } from "bun";

// ============================================
// PostgreSQL Connection
// ============================================
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// Client migrations (single connection)
export const migrationClient = postgres(connectionString, { max: 1 });

// Client queries (connection pool)
const queryClient = postgres(connectionString, {
  max: 10, // Maximum pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// ============================================
// Redis Connection
// ============================================
// const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// const cl = new RedisClient(redisUrl);
// export const redis: RedisClientType = createClient({
//   url: redisUrl,
//   socket: {
//     reconnectStrategy: (retries: number) => {
//       if (retries > 10) {
//         return new Error("Redis connection failed after 10 retries");
//       }
//       return retries * 100; // Exponential backoff
//     },
//   },
// });

// redis.on("error", (err: Error) => console.error("Redis Client Error:", err));
// redis.on("connect", () => console.log("✅ Redis connected"));
// redis.on("disconnect", () => console.log("❌ Redis disconnected"));

// // Connect Redis
// (async () => {
//   try {
//     await redis.connect();
//   } catch (error) {
//     console.error("Failed to connect to Redis:", error);
//   }
// })();

// ============================================
// Helper Functions
// ============================================

// // Cache helper TTL
// export async function getCached<T>(
//   key: string,
//   fetchFn: () => Promise<T>,
//   ttl: number = 3600, // Default 1 hour
// ): Promise<T> {
//   try {
//     const cached = await redis.get(key);
//     if (cached) {
//       return JSON.parse(cached) as T;
//     }

//     const data = await fetchFn();
//     await redis.setEx(key, ttl, JSON.stringify(data));
//     return data;
//   } catch (error) {
//     console.error("Cache error:", error);
//     return fetchFn();
//   }
// }

// // Invalidate cache
// export async function invalidateCache(pattern: string): Promise<void> {
//   try {
//     const keys = await redis.keys(pattern);
//     if (keys.length > 0) {
//       await redis.del(keys);
//     }
//   } catch (error) {
//     console.error("Cache invalidation error:", error);
//   }
// }

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing database connections...");
  await queryClient.end();
  await migrationClient.end();
  // await redis.quit();
  process.exit(0);
});
