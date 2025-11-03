# AgroSense: Crop Lifecycle Advisory System
 
![Status](https://img.shields.io/badge/Status-Active%20Development-blue)
 
A comprehensive platform designed to support smallholder farmers across all phases of the crop lifecycle—from pre-sowing planning to post-harvest market advisory—using satellite remote sensing, real-time data, generative AI, and market intelligence.
 
## Table of Contents
 
- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Milestones](#project-milestones)
- [How It Works](#how-it-works)
- [Data Integration](#data-integration)
- [API References](#api-references)
- [Contributing](#contributing)
 
## Overview
 
AgroSense bridges the gap between smallholder farmers and modern agricultural technology. Smallholder farmers often lack timely, location-specific guidance for crop management decisions. This platform integrates multiple data sources and AI to provide:
 
- **Real-time crop monitoring** using satellite imagery (NDVI)
- **Weather-based advisory** for irrigation and crop management
- **Soil and agronomic insights** for fertilizer application
- **Market intelligence** for optimal harvest timing and selling decisions
- **Multilingual voice/text interface** for accessibility across literacy levels
 
### Key Principles
 
✓ Support every stage of the crop lifecycle: planning, growth, harvest, and post-harvest decision-making  
✓ Provide actionable recommendations, not just alerts or detections  
✓ Enable access for farmers of all literacy levels through voice interaction in local languages  
✓ Combine remote sensing (e.g., NDVI) with agronomic models and market data
 
## Key Features
 
| Feature | Description |
|---------|-------------|
| **Pre-Sowing Planning** | Crop suitability analysis, optimal sowing window identification |
| **Real-time Monitoring** | NDVI-based vegetation health tracking, anomaly detection |
| **Mid-Season Advisory** | Irrigation, fertilizer, and pest management recommendations |
| **Yield Prediction** | Forecasted yield with uncertainty bounds |
| **Harvest Timing** | Optimal harvest window recommendations with risk assessment |
| **Market Intelligence** | Real-time mandi prices, trend analysis, selling recommendations |
| **Multilingual Support** | Voice and text interaction in Indian regional languages |
| **Personalized Context** | Location-aware, crop-specific, history-based recommendations |
 
## Project Structure
 
```
ds-ai-lab-group-4/
├── milestone-one/
│   └── agrosense.md                 # Project vision, user journey, benchmark analysis
├── milestone-two/
│   └── dataset_preprocessing.md     # Data integration and preprocessing pipelines
├── milestone-three/
│   └── model_architecture.md        # LLM-powered system architecture and design
└── README.md                        # This file
```
 
### Milestone Details
 
#### **Milestone One: Vision & Planning**
- Product vision and principles
- User journey mapping across crop lifecycle
- Benchmark analysis (OneSoil, ChatGPT limitations)
- Sample farmer interaction scenarios
 
#### **Milestone Two: Data & Preprocessing**
- Integration of 5+ data sources:
  - Google Earth Engine satellite embeddings
  - Open-Meteo weather API
  - Digital Soil Map of the World (FAO-UNESCO)
  - Agmarknet mandi price data
  - Nominatim geocoding service
- Complete preprocessing pipelines with Python code examples
- Data cleaning, normalization, and feature engineering
 
#### **Milestone Three: System Architecture**
- LLM-powered system design (Google Gemini 2.5 Pro)
- Request-response flow with detailed state diagrams
- Server layer components (Query Parser, Context Retriever, etc.)
- Tool orchestration and streaming response handling
- Database schema for user context and history
 
## Tech Stack
 
### AI & ML
- **LLM**: Google Gemini 2.5 Pro (1M token context window)
- **Framework**: LangChain / LLM orchestration libraries
- **Embeddings**: Satellite embedding vectors (Google Earth Engine)
 
### Data & APIs
- **Remote Sensing**: Google Earth Engine (Sentinel-2, Landsat)
- **Weather**: Open-Meteo API (global historical & forecast data)
- **Soil Data**: Digital Soil Map of the World (FAO-UNESCO)
- **Market Data**: Agmarknet / eNAM APIs (Indian mandis)
- **Geocoding**: Nominatim (OpenStreetMap)
 
## Getting Started
 
### Prerequisites
- Python 3.8+
- Git
- Google Earth Engine account (for satellite data)
- API keys for Open-Meteo, Agmarknet (if applicable)
 
## Project Milestones
 
### ✓ Milestone One: Vision & Planning
- [x] Project vision and user journeys
- [x] Benchmark analysis
- [x] Farmer interaction scenarios
 
### ✓ Milestone Two: Data Integration & Preprocessing
- [x] Data source identification (5 APIs/services)
- [x] Preprocessing pipelines with code examples
- [x] Feature engineering strategies
- [x] Train/validation data splits
 
### ✓ Milestone Three: System Architecture
- [x] LLM-powered system design
- [x] Server layer components
- [x] Tool orchestration framework
- [x] Detailed request-response flows
- [x] Database schema
 
### Upcoming: Implementation & Deployment
- [ ] Backend API development (FastAPI)
- [ ] LLM integration (Gemini 2.5 Pro)
- [ ] Frontend development (React/React Native)
- [ ] Database setup and data loading
- Testing and validation
- Pilot deployment with farmers
 
## How It Works
 
### User Query Flow
 
```
Farmer Query → Query Parser → Context Retriever → LLM Preparation
    ↓
LLM Processing → Tool Orchestration → External APIs (parallel calls)
    ↓
Response Formatting → Streaming to UI → Farmer Receives Advice
    ↓
Store Interaction in History DB → Improve Future Recommendations
```
 
### Example: Irrigation Advisory
 
```
Farmer: "Should I irrigate my wheat field today?"
 
System Flow:
1. Parse intent: Irrigation decision needed
2. Retrieve context: Location (Meerut), Crop (Wheat), Stage (Tillering)
3. Call tools in parallel:
   - Get weather forecast (0mm rain, 28°C, 65% humidity)
   - Get soil moisture (35%, optimal is 45-55%)
   - Get crop water requirements (2.5mm/day at tillering)
4. LLM reasoning: "Soil moisture is below threshold, no rain forecasted"
5. Recommendation: "YES, irrigate today. Apply 40mm water in early morning."
```
 
## Data Integration
 
### Data Sources Overview
 
| Source | Purpose | Format | Coverage |
|--------|---------|--------|----------|
| **Google Earth Engine** | Satellite embeddings, NDVI | ImageCollection | Global, 30m resolution |
| **Open-Meteo API** | Weather forecast & historical | JSON/REST API | Global, hourly/daily |
| **Digital Soil Map** | Soil types and properties | Vector shapefile | Global, 1:5M scale |
| **Agmarknet** | Mandi prices and arrivals | HTML/CSV | India, daily data |
| **Nominatim** | Geocoding and reverse geocoding | GeoJSON/REST API | Global coverage |
 
## API References
 
### Weather API (Open-Meteo)
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Parameters**: `latitude`, `longitude`, `hourly`, `daily`, `forecast_days`
- **Documentation**: [Open-Meteo Docs](https://open-meteo.com/en/docs)
 
### Satellite Embeddings (Google Earth Engine)
- **Dataset**: `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`
- **Resolution**: ~30m (Sentinel-2 & Landsat harmonized)
- **Documentation**: [Earth Engine Docs](https://developers.google.com/earth-engine)
 
### Mandi Prices (Agmarknet)
- **Portal**: [Agmarknet](https://agmarknet.gov.in/)
- **eNAM Integration**: [eNAM Portal](https://enam.gov.in/web/)
- **Commodity List**: [Agmarknet Commodities](https://agmarknet.gov.in/OtherPages/CommodityList.aspx)
 
### Soil Data (FAO-UNESCO)
- **Dataset**: Digital Soil Map of the World (DSMW v3.6)
- **Format**: Vector shapefile, WMS, GeoTIFF
- **Repository**: [SoilWise HE](https://repository.soilwise-he.eu/)
 
### Geocoding (Nominatim)
- **Endpoint**: `https://nominatim.openstreetmap.org/`
- **Documentation**: [Nominatim Docs](https://nominatim.org/release-docs/latest/)
