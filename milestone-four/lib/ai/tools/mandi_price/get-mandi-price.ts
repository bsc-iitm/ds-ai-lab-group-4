import { tool } from "ai";
import { z } from "zod";
import { executeSql } from "./db_util"; // Implement this in your project

// --- SCHEMA DEFINITION (Crucial for the LLM) ---
const CSV_SCHEMA = `
Table Name: project_data

Columns and Data Types:
- State_Name (TEXT): Name of the state.
- District_Name (TEXT): Name of the district.
- Market_Name (TEXT): Name of the market/mandi.
- Variety (TEXT): Name of the commodity variety.
- Group (TEXT): Name of the commodity group.
- Arrivals_Tonnes (REAL/NUMERIC): Total commodity arrival in tonnes.
- Min_Price (REAL/NUMERIC): Minimum reported price.
- Max_Price (REAL/NUMERIC): Maximum reported price.
- Modal_Price (REAL/NUMERIC): The most frequently quoted price.
- Reported_Date (TEXT/DATE): The date the price was reported (format YYYY-MM-DD).
- Grade (TEXT): The quality grade of the commodity.
- Commodity_Name (TEXT): The name of the commodity. IMPORTANT: When filtering this column, use the LIKE operator with wildcards (%) to enable fuzzy matching for part of the name (e.g., WHERE Commodity LIKE '%Amla%').
`;

export const getMandiPrice = tool({
    description: `Executes a SQL SELECT query against the project data table. The table name is 'project_data'.
    When writing the query, use the column names EXACTLY AS WRITTEN in the SCHEMA below.
    The primary purpose is to find aggregated statistics (MIN, MAX, AVG, SUM, COUNT) or specific records based on price, date, state, or commodity.
    
    SCHEMA: 
    ${CSV_SCHEMA}
    
    ALWAYS return a single, valid SQL SELECT statement ready for execution. DO NOT include any explanations, markdown formatting (like triple backticks), or extra text outside the query.`,
    
    inputSchema: z.object({
        query: z.string().describe("The full, valid SQL SELECT statement to execute against the 'project_data' table (e.g., 'SELECT AVG(Modal_Price) FROM project_data WHERE Commodity = \"Tomato\" AND District_Name = \"Nashik\"').")
    }),
    
    execute: async (input) => {
        const generatedSql = input.query;
        
        try {
            // NOTE: You must implement and define 'executeSql' to connect to your database.
            // Example implementation for SQLite would use a library like 'sqlite' or 'sqlite3'.
            // Ensure you limit the number of rows returned here or in the generated SQL.
            const results = await executeSql(generatedSql);

            if (results.length === 0) {
                return {
                    success: false,
                    message: "The SQL query returned no results. Try modifying the query to be less restrictive."
                };
            }

            // Return limited results for the LLM to summarize
            return {
                success: true,
                query: generatedSql,
                data: JSON.stringify(results.slice(0, 10)) // Limit to 10 rows for context safety
            };

        } catch (e) {
            return {
                success: false,
                error: `SQL execution failed. Check the generated SQL syntax: ${generatedSql}`
            };
        }
    },
});