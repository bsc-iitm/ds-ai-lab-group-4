#!/usr/bin/env python3
"""
Google Earth Engine Crop Data Fetcher (Python Version)

This script can be used as an alternative to the Node.js implementation.
It uses the official Google Earth Engine Python API.

SETUP:
1. Install: pip install earthengine-api google-auth
2. Authenticate: earthengine authenticate
3. Run: python gee_crop_fetcher.py <latitude> <longitude>

For integration with Next.js, you can call this script from your API route.
"""

import sys
import json
import ee

# Initialize Earth Engine
try:
    ee.Initialize()
except Exception as e:
    print(f"Error initializing Earth Engine: {e}")
    print("Run 'earthengine authenticate' first")
    sys.exit(1)


def get_crop_data(latitude: float, longitude: float, radius_meters: int = 5000):
    """
    Fetch crop data from Google Earth Engine for a given location.
    
    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
        radius_meters: Radius around the point to analyze (default: 5000m = 5km)
    
    Returns:
        Dictionary with crop data
    """
    # Create a point and buffer it
    point = ee.Geometry.Point([longitude, latitude])
    roi = point.buffer(radius_meters)  # 5km buffer
    
    # Load MODIS Land Cover dataset
    # MCD12Q1: MODIS Land Cover Type Yearly Global 500m
    modis = ee.ImageCollection('MODIS/006/MCD12Q1')
    
    # Get the most recent year available
    latest_year = modis.aggregate_max('system:time_start').getInfo()
    latest_image = modis.filterDate(
        ee.Date(latest_year).format('YYYY'),
        ee.Date(latest_year).add(1, 'year').format('YYYY')
    ).first()
    
    # Select the land cover classification band
    # LC_Type1: IGBP classification
    # Class 12 = Croplands, Class 14 = Cropland/Natural Vegetation Mosaics
    land_cover = latest_image.select('LC_Type1')
    
    # Create cropland mask (classes 12 and 14)
    croplands = land_cover.eq(12).Or(land_cover.eq(14))
    
    # Calculate area statistics
    area_stats = croplands.multiply(ee.Image.pixelArea()).reduceRegion(
        reducer=ee.Reducer.sum(),
        geometry=roi,
        scale=500,  # MODIS resolution
        maxPixels=1e9
    )
    
    # Get total area
    total_area = roi.area().getInfo()  # in square meters
    cropland_area = area_stats.get('LC_Type1').getInfo() or 0
    
    # For more detailed crop classification, you can use:
    # 1. Sentinel-2 imagery with machine learning models
    # 2. USDA NASS Cropland Data Layer (US only)
    # 3. Custom crop classification models
    
    # For India, we'll use a simplified approach with MODIS
    # and supplement with regional crop data knowledge
    
    # Calculate percentage
    cropland_percentage = (cropland_area / total_area * 100) if total_area > 0 else 0
    
    # Estimate crop distribution based on region and season
    # This is a simplified approach - in production, use actual crop classification
    crops = estimate_crop_distribution(latitude, longitude, cropland_area)
    
    return {
        "crops": crops,
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "metadata": {
            "year": str(ee.Date(latest_year).format('YYYY').getInfo()),
            "source": "Google Earth Engine - MODIS MCD12Q1",
            "cropland_area_m2": cropland_area,
            "total_area_m2": total_area,
            "cropland_percentage": round(cropland_percentage, 2)
        }
    }


def estimate_crop_distribution(lat: float, lon: float, total_cropland_area: float):
    """
    Estimate crop distribution based on region and typical crop patterns in India.
    In production, this would use actual crop classification from satellite imagery.
    """
    # Determine region
    if lat > 28:
        region = "north" if lon > 80 else "east"
    elif lat < 20:
        region = "south" if lon > 78 else "west"
    else:
        region = "east" if lon > 80 else ("central" if lon > 75 else "west")
    
    # Regional crop patterns (typical percentages)
    crop_patterns = {
        "north": [
            {"name": "Wheat", "percentage": 35.2, "season": "Rabi"},
            {"name": "Rice", "percentage": 27.6, "season": "Kharif"},
            {"name": "Sugarcane", "percentage": 11.8, "season": "Year-round"},
            {"name": "Cotton", "percentage": 9.0, "season": "Kharif"},
            {"name": "Maize", "percentage": 7.9, "season": "Kharif"},
            {"name": "Mustard", "percentage": 5.6, "season": "Rabi"},
            {"name": "Others", "percentage": 2.9}
        ],
        "south": [
            {"name": "Rice", "percentage": 42.5, "season": "Kharif"},
            {"name": "Coconut", "percentage": 19.0, "season": "Year-round"},
            {"name": "Sugarcane", "percentage": 14.5, "season": "Year-round"},
            {"name": "Cotton", "percentage": 10.6, "season": "Kharif"},
            {"name": "Groundnut", "percentage": 7.0, "season": "Kharif"},
            {"name": "Ragi", "percentage": 3.4, "season": "Kharif"},
            {"name": "Others", "percentage": 0.9}
        ],
        "east": [
            {"name": "Rice", "percentage": 51.2, "season": "Kharif"},
            {"name": "Jute", "percentage": 11.8, "season": "Kharif"},
            {"name": "Wheat", "percentage": 10.7, "season": "Rabi"},
            {"name": "Potato", "percentage": 9.0, "season": "Rabi"},
            {"name": "Maize", "percentage": 7.9, "season": "Kharif"},
            {"name": "Pulses", "percentage": 5.1, "season": "Rabi"},
            {"name": "Others", "percentage": 1.4}
        ],
        "west": [
            {"name": "Cotton", "percentage": 31.5, "season": "Kharif"},
            {"name": "Sugarcane", "percentage": 23.1, "season": "Year-round"},
            {"name": "Wheat", "percentage": 19.1, "season": "Rabi"},
            {"name": "Rice", "percentage": 11.8, "season": "Kharif"},
            {"name": "Groundnut", "percentage": 7.9, "season": "Kharif"},
            {"name": "Bajra", "percentage": 3.4, "season": "Kharif"},
            {"name": "Others", "percentage": 0.8}
        ],
        "central": [
            {"name": "Wheat", "percentage": 40.0, "season": "Rabi"},
            {"name": "Rice", "percentage": 27.6, "season": "Kharif"},
            {"name": "Soybean", "percentage": 14.6, "season": "Kharif"},
            {"name": "Cotton", "percentage": 9.0, "season": "Kharif"},
            {"name": "Pulses", "percentage": 5.6, "season": "Rabi"},
            {"name": "Maize", "percentage": 3.4, "season": "Kharif"},
            {"name": "Others", "percentage": 0}
        ]
    }
    
    pattern = crop_patterns.get(region, crop_patterns["central"])
    
    # Convert percentages to actual areas
    crops = []
    for crop in pattern:
        area = (total_cropland_area * crop["percentage"] / 100) / 10000  # Convert to hectares
        crops.append({
            "name": crop["name"],
            "area": round(area, 2),
            "percentage": crop["percentage"],
            "season": crop.get("season")
        })
    
    return crops


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python gee_crop_fetcher.py <latitude> <longitude>")
        print("Example: python gee_crop_fetcher.py 28.7041 77.1025")
        sys.exit(1)
    
    try:
        lat = float(sys.argv[1])
        lon = float(sys.argv[2])
        
        result = get_crop_data(lat, lon)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

