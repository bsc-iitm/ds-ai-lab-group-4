// sqliteSetup.ts - One-time script to create and populate the database

import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(process.cwd(), 'mandi.db');
const CSV_FILE = path.join(process.cwd(), 'mandi_data.csv'); // Make sure to rename your CSV file

const TABLE_NAME = 'project_data';

// Note: Column names are mapped to underscores for easier SQL querying.
const COLUMN_MAP = {
    'State Name': 'State_Name',
    'District Name': 'District_Name',
    'Market Name': 'Market_Name',
    'Variety': 'Variety',
    'Group': 'Group_Name',
    'Arrivals (T)': 'Arrivals_Tonnes',
    'Min Price': 'Min_Price',
    'Max Price': 'Max_Price',
    'Modal Price': 'Modal_Price',
    'Reported Date': 'Reported_Date',
    'Grade': 'Grade',
    'Commodity_Name': 'Commodity_Name'
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    State_Name TEXT,
    District_Name TEXT,
    Market_Name TEXT,
    Variety TEXT,
    Group_Name TEXT,
    Arrivals_Tonnes REAL,
    Min_Price REAL,
    Max_Price REAL,
    Modal_Price REAL,
    Reported_Date TEXT,
    Grade TEXT,
    Commodity_Name TEXT
);
`;

async function setupDatabase() {
    console.log(`Connecting to database file: ${DB_FILE}`);
    
    // Open the database in asynchronous mode
    const db = await sqlite.open({
        filename: DB_FILE,
        driver: sqlite3.Database,
    });

    // 1. Create the table
    await db.exec(CREATE_TABLE_SQL);
    console.log("Table created successfully.");

    // 2. Prepare for bulk insert
    const insertStmt = await db.prepare(
        `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    let rowCount = 0;
    
    // Use transaction for massive performance boost on inserts
    await db.run('BEGIN TRANSACTION;');

    try {
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(CSV_FILE)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true
                }))
                .on('data', async (record) => {
                    const rowData = [
                        record['State Name'],
                        record['District Name'],
                        record['Market Name'],
                        record['Variety'],
                        record['Group'],
                        parseFloat(record['Arrivals (T)'] || '0'),
                        parseFloat(record['Min Price'] || '0'),
                        parseFloat(record['Max Price'] || '0'),
                        parseFloat(record['Modal Price'] || '0'),
                        record['Reported Date'],
                        record['Grade'],
                        record['Commodity'],
                    ];

                    await insertStmt.run(rowData);
                    rowCount++;
                })
                .on('end', () => {
                    resolve();
                })
                .on('error', (err) => {
                    reject(err);
                });
        });

        await db.run('COMMIT;');
        console.log(`\nFinished loading ${rowCount} rows into ${DB_FILE}.`);
        
    } catch (error) {
        await db.run('ROLLBACK;');
        console.error("Database setup failed. Rolling back transaction.", error);
    } finally {
        await insertStmt.finalize();
        await db.close();
    }
}

setupDatabase().catch(console.error);