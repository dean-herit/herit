import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.POSTGRES_URL!

// For production, use connection pooling
const sql = postgres(connectionString, { 
  max: 1,
  idle_timeout: 20,
  connect_timeout: 60,
})

export const db = drizzle(sql, { schema })

export type Database = typeof db