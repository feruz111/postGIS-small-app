// lib/db.ts
import { Pool } from "pg";

let _pool: Pool | undefined;

export function getPool() {
    if (!_pool) {
        _pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    return _pool;
}