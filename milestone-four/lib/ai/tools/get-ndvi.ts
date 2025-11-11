import * as dotenv from 'dotenv';
dotenv.config();

import { tool } from "ai";
import { z } from "zod";
import * as ee from "@google/earthengine";

// --- Earth Engine Initialization State ---
// This state is persisted across warm serverless function instances.
let eeInitialized = false;

async function ensureEEInitialized() {
    if (eeInitialized) {
        return; // Already initialized
    }
    
    // 1. EXTRACT and VALIDATE credentials outside the try block
    const privateKeyJsonString = process.env.EE_PRIVATE_KEY;
    const serviceAccountEmail = process.env.EE_SERVICE_ACCOUNT_EMAIL;
    
    if (!privateKeyJsonString || !serviceAccountEmail) {
        throw new Error(
            "EE Auth Error: EE_PRIVATE_KEY or EE_SERVICE_ACCOUNT_EMAIL is missing. Check your .env file or Vercel settings."
        );
    }

    try {
        console.log("Attempting to initialize Earth Engine client via explicit key...");
        
        // Use the non-null-asserted variables here, now guaranteed to be strings.
        
        // 2. Authenticate using the Service Account key and EMAIL
        await ee.data.authenticateViaPrivateKey(
            // The JSON.parse() is critical and requires the variable to be a string
            JSON.parse(privateKeyJsonString),
            () => { console.log("EE authentication successful (callback)."); },
            (error: unknown) => { throw new Error(`EE Auth Failed: ${String(error)}`); },
            
            // 3. PASS THE SERVICE ACCOUNT EMAIL explicitly
            serviceAccountEmail 
        );

        // 4. Initialize the client to enable the API calls
        await ee.initialize(); 
        
        eeInitialized = true;
        console.log("Earth Engine client fully initialized.");

    } catch (error: unknown) {
        console.error(`FAILED TO INITIALIZE EARTH ENGINE: ${error}`);
        // If the authentication itself failed due to a bad key format, this catch block runs.
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`EE Initialization Failed: ${errorMessage}. Check key format and permissions.`);
    }
}
// ------------------------------------------


// --- Earth Engine Helper Function ---

/**
 * Calculates the median Normalized Difference Vegetation Index (NDVI) 
 * for a specific point and date range.
 */
async function calculateNdvi(
    longitude: number,
    latitude: number,
    startDate: string,
    endDate: string
): Promise<number | null> {
    try {
        const point = ee.Geometry.Point([longitude, latitude]);

        const image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
            .filterDate(startDate, endDate)
            .filterBounds(point)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            .median();

        const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');

        // Fetch the result
        const ndviData = await ndvi.reduceRegion({
            reducer: ee.Reducer.first(),
            geometry: point,
            scale: 10,
        }).get('NDVI');

        const ndviValue = ndviData as number;

        if (ndviValue === undefined || ndviValue === null) {
            return null;
        }

        return ndviValue;

    } catch (e) {
        console.error(`Earth Engine error in calculateNdvi: ${e instanceof Error ? e.message : String(e)}`);
        return null;
    }
}

// --- Geocoding Helper Function ---

/**
 * Geocodes a city name to latitude and longitude using Open-Meteo.
 */
async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        const result = data.results[0];
        return {
            latitude: result.latitude,
            longitude: result.longitude,
        };
    } catch {
        return null;
    }
}


// --- The Vercel AI SDK Tool Definition ---

export const getNdvi = tool({
    description: "Calculates the median Normalized Difference Vegetation Index (NDVI) for a specific location and date range, useful for assessing vegetation health. Provide either a city name or specific latitude/longitude coordinates. If no dates are given, it defaults to the last 30 days.",
    inputSchema: z.object({
        city: z.string().optional().describe("The name of a city (e.g., 'Nashik', 'Paris'). If provided, latitude and longitude are ignored."),
        latitude: z.number().optional().describe("The latitude of the point (e.g., 20.2042). Required if 'city' is not provided."),
        longitude: z.number().optional().describe("The longitude of the point (e.g., 73.8272). Required if 'city' is not provided."),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("The start date for imagery in 'YYYY-MM-DD' format (e.g., '2023-06-01'). Defaults to 30 days ago if not provided."),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("The end date for imagery in 'YYYY-MM-DD' format (e.g., '2023-08-31'). Defaults to today if not provided."),
    }).refine(data => data.city || (data.latitude != null && data.longitude != null), {
        message: "You must provide either a 'city' or both 'latitude' and 'longitude'.",
    }),
    execute: async (input) => {
        
        // --- STEP 1: Ensure Earth Engine is Initialized ---
        try {
            await ensureEEInitialized();
        } catch (e) {
             // Return an error if initialization failed
            return { error: (e as Error).message };
        }

        // --- STEP 2: Handle Date Defaults ---
        const finalEndDate = input.endDate || new Date().toISOString().split('T')[0];
        
        let finalStartDate = input.startDate;
        if (!finalStartDate) {
            const endDateObj = new Date(finalEndDate);
            endDateObj.setDate(endDateObj.getDate() - 30);
            finalStartDate = endDateObj.toISOString().split('T')[0];
        }

        // --- STEP 3: Handle Location ---
        let latitude: number;
        let longitude: number;
        let locationName: string;

        if (input.city) {
            const coords = await geocodeCity(input.city);
            if (!coords) {
                return {
                    error: `Could not find coordinates for city: '${input.city}'. Please check the spelling or try latitude/longitude.`,
                };
            }
            latitude = coords.latitude;
            longitude = coords.longitude;
            locationName = input.city;
        } else {
            latitude = input.latitude!;
            longitude = input.longitude!;
            locationName = `Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        }

        // --- STEP 4: Perform Calculation ---
        const ndviValue = await calculateNdvi(longitude, latitude, finalStartDate, finalEndDate);

        // --- STEP 5: Return Result ---
        if (ndviValue === null) {
            return {
                error: `Could not retrieve NDVI for ${locationName} between ${finalStartDate} and ${finalEndDate}. This likely means no suitable images were found (e.g., too much cloud cover).`,
            };
        }

        return {
            location: locationName,
            latitude: latitude,
            longitude: longitude,
            dateRange: {
                startDate: finalStartDate,
                endDate: finalEndDate,
            },
            medianNdvi: ndviValue,
            ndviDescription: `The calculated median NDVI for ${locationName} is ${ndviValue.toFixed(4)}. Values close to 1 indicate dense, healthy vegetation, while values close to 0 indicate sparse vegetation or bare soil.`,
        };
    },
});