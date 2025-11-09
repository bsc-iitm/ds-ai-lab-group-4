import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Establish a single connection for the whole app
const client = postgres(process.env.POSTGRES_URL!, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Max seconds a connection can be idle
  connect_timeout: 10, // Max seconds to wait for a connection
});

export const db = drizzle(client);