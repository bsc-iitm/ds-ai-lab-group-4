// db_utils.ts - Utility functions for the queryCsv tool

import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs'; // Import file system module

const RELATIVE_DB_PATH = 'lib/ai/tools/mandi_price/mandi.db'; 

// Use process.cwd() (the project root) and join the path.
const DB_FILE = path.join(process.cwd(), RELATIVE_DB_PATH);


if (!fs.existsSync(DB_FILE)) {
    console.error(`FATAL ERROR: Database file not found at path: ${DB_FILE}`);
} else {
    // Check file size to ensure it's not an empty file
    const stats = fs.statSync(DB_FILE);
    console.log(`Database file found. Size: ${stats.size} bytes. Path: ${DB_FILE}`);
    if (stats.size < 1000) { 
        // 1000 bytes is a rough threshold; if it's too small, it's likely empty.
        console.warn("WARNING: Database file is very small. It might be empty or corrupted.");
    }
}

/**
 * Executes a single SQL SELECT query against the SQLite database.
 * @param sqlQuery The SQL query string to execute.
 * @returns An array of results (objects).
 */
export async function executeSql(sqlQuery: string): Promise<any[]> {
    if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
        throw new Error("Only SELECT queries are allowed for security.");
    }

    // --- DEBUGGING STEP ---
    console.log("SQL Query to Execute:", sqlQuery);
    // --- END DEBUGGING ---
    
    // Open the database for each execution (common in serverless/Vercel)
    const db = await sqlite.open({
        filename: DB_FILE,
        driver: sqlite3.Database,
        // Set to read-only if you absolutely don't want any writes
        mode: sqlite3.OPEN_READONLY 
    });
    
    try {
        const results = await db.all(sqlQuery);
        // --- DEBUGGING STEP ---
        console.log("Query Results Count:", results.length);
        // --- END DEBUGGING ---
        return results;
    } finally {
        await db.close();
    }
}