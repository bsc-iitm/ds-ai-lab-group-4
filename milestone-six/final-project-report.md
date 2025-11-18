# AgroSense: Final Project Report
## Crop Lifecycle Advisory System

**Project:** AgroSense - AI-Powered Agricultural Advisory Platform  
**Group:** DS-AI Lab Group 4  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Project Milestones](#project-milestones)
4. [Implementation Details](#implementation-details)
5. [Technical Architecture](#technical-architecture)
6. [Features and Capabilities](#features-and-capabilities)
7. [Data Sources and Integration](#data-sources-and-integration)
8. [AI Tools and Functions](#ai-tools-and-functions)
9. [Technology Stack](#technology-stack)
10. [Testing and Validation](#testing-and-validation)
11. [Challenges and Solutions](#challenges-and-solutions)
12. [Future Enhancements](#future-enhancements)
13. [Conclusion](#conclusion)

---

## Executive Summary

AgroSense is a comprehensive AI-powered agricultural advisory platform designed to support smallholder farmers across all phases of the crop lifecycle. The system integrates satellite remote sensing, real-time weather data, soil analysis, market intelligence, and generative AI to provide location-specific, actionable recommendations.

**Key Achievements:**
- Complete end-to-end implementation of an AI chatbot system
- Integration of 6+ external data sources (weather, satellite, soil, market data)
- Development of 15+ specialized agricultural advisory tools
- Full-stack web application with Next.js and modern UI
- Real-time streaming responses with context-aware recommendations
- Support for Indian agricultural context and terminology

**Impact:**
The platform addresses critical gaps in agricultural advisory services by providing:
- Timely, location-specific guidance for crop management decisions
- Integration of multiple data sources for comprehensive insights
- Conversational interface accessible to farmers of all literacy levels
- Support across the entire crop lifecycle from planning to post-harvest

---

## Project Overview

### Vision

AgroSense aims to bridge the gap between smallholder farmers and modern agricultural technology by providing timely, location-specific guidance from choosing what to plant, to managing crop growth, to deciding when and where to sell.

### Key Principles

1. **Full Lifecycle Support**: Cover every stage from pre-sowing planning to post-harvest market decisions
2. **Actionable Recommendations**: Provide specific, implementable advice rather than generic alerts
3. **Accessibility**: Enable access for farmers of all literacy levels through conversational interface
4. **Data Integration**: Combine remote sensing (NDVI), weather, soil, and market data for comprehensive insights

### Problem Statement

Smallholder farmers in India face several challenges:
- Lack of timely, location-specific guidance for crop management
- Limited access to real-time market prices and trends
- Insufficient integration of satellite data, weather forecasts, and agronomic knowledge
- Existing solutions (like OneSoil) focus on limited phases or lack conversational AI
- General AI models (ChatGPT) provide region-inappropriate or unsafe recommendations

### Solution

AgroSense provides a unified platform that:
- Integrates multiple data sources (satellite imagery, weather, soil, market data)
- Uses generative AI (Google Gemini) for context-aware, conversational advisory
- Provides location-specific recommendations validated against Indian agricultural practices
- Supports the entire crop lifecycle with specialized tools for each phase

---

## Project Milestones

### Milestone One: Vision & Planning

**Deliverables:**
- Project vision and principles document
- User journey mapping across crop lifecycle stages
- Benchmark analysis (OneSoil, ChatGPT limitations)
- Sample farmer interaction scenarios
- User stories for each lifecycle stage

**Key Outcomes:**
- Defined comprehensive scope covering all crop lifecycle phases
- Identified gaps in existing solutions
- Established user-centric design principles

### Milestone Two: Data Integration & Preprocessing

**Deliverables:**
- Integration of 6+ data sources:
  - Google Earth Engine (satellite embeddings, NDVI)
  - Open-Meteo API (weather forecast & historical data)
  - Digital Soil Map of the World (FAO-UNESCO)
  - Agmarknet (mandi price data)
  - Nominatim (geocoding service)
- Complete preprocessing pipelines with Python code examples
- Data cleaning, normalization, and feature engineering strategies

**Key Outcomes:**
- Established data pipelines for all major data sources
- Created reusable preprocessing functions
- Documented data integration patterns

### Milestone Three: System Architecture

**Deliverables:**
- LLM-powered system design (Google Gemini 2.5 Pro)
- Detailed request-response flow diagrams
- Server layer component specifications:
  - Query Parser
  - Context Retriever
  - Context Assembler
  - Prompt Orchestrator
  - Response Formatter
- Tool orchestration framework
- Database schema for user context and history

**Key Outcomes:**
- Designed scalable, modular architecture
- Defined clear separation of concerns
- Established patterns for tool orchestration

### Milestone Four: Implementation & Deployment

**Deliverables:**
- Full-stack web application implementation
- 15+ specialized agricultural advisory tools
- Real-time streaming chat interface
- Database integration with user management
- Authentication and authorization system
- Production-ready deployment configuration

**Key Outcomes:**
- Complete working system with all planned features
- Production-ready codebase
- Comprehensive tool library for agricultural advisory

---

## Implementation Details

### System Components

#### 1. Frontend (Next.js 15)
- **Framework**: Next.js 15 with React 19
- **UI Components**: Custom components built with Radix UI and Tailwind CSS
- **Chat Interface**: Real-time streaming chat with message history
- **Artifacts System**: Document, code, sheet, and image editing capabilities
- **Interactive Maps**: Leaflet-based maps for location selection and NDVI visualization

#### 2. Backend API
- **Framework**: Next.js API Routes
- **LLM Integration**: Google Gemini 2.5 Pro via AI SDK
- **Streaming**: Server-Sent Events (SSE) for real-time responses
- **Authentication**: NextAuth.js for user management
- **Database**: PostgreSQL with Drizzle ORM

#### 3. AI Tools Library
15+ specialized tools covering all crop lifecycle phases:

**Pre-Sowing Tools:**
- `getCropRecommendation`: Crop suitability analysis
- `getSowingCalendar`: Optimal sowing window identification
- `getCostBenefitAnalysis`: Financial planning and profitability analysis

**Growth Phase Tools:**
- `getSoilAnalysis`: Soil moisture and nutrient analysis
- `getIrrigationAdvisory`: Irrigation scheduling recommendations
- `getFertilizerRecommendation`: Nutrient management advice
- `getNDVI`: Vegetation health monitoring via satellite imagery

**Harvest Phase Tools:**
- `getYieldPrediction`: Yield forecasting with uncertainty bounds
- `getHarvestTiming`: Optimal harvest window recommendations

**Post-Harvest Tools:**
- `getMandiPrice`: Real-time market price data
- `getPriceTrendAnalysis`: Price trend analysis and selling recommendations

**General Tools:**
- `getWeather`: Current weather and forecasts
- `getCropData`: Regional crop data visualization

#### 4. Database Schema
- **Users**: User profiles, authentication, preferences
- **Chats**: Conversation sessions with metadata
- **Messages**: Chat messages with tool calls and responses
- **Suggestions**: AI-generated follow-up suggestions

---

## Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Chat UI    │  │  Artifacts   │  │  Interactive │     │
│  │              │  │   Editor     │  │     Maps     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  Chat Route  │  │  Streaming   │     │
│  │  Middleware  │  │              │  │   Handler    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Layer - Request Processing               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Context    │  │    Prompt    │  │   Response  │     │
│  │  Assembler   │  │ Orchestrator │  │  Formatter   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  LLM Processing Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Gemini     │  │   Tool       │  │   Stream     │     │
│  │   2.5 Pro    │  │   Caller     │  │  Processor   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           External Data Sources & Tools                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Weather    │  │   Satellite   │  │    Market    │     │
│  │    API       │  │   (GEE)       │  │    Data      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Soil      │  │  Geocoding   │  │   Database   │     │
│  │    Data      │  │  (Nominatim) │  │   (Postgres) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Request-Response Flow

1. **User Query**: Farmer submits query through web interface
2. **Authentication**: System validates user credentials
3. **Context Retrieval**: Fetch user profile, location, crop history, preferences
4. **Query Parsing**: Extract intent and parameters from user input
5. **Prompt Construction**: Build system prompt with context and available tools
6. **LLM Processing**: Gemini analyzes query and determines required tools
7. **Tool Orchestration**: Execute multiple tools in parallel (weather, soil, market data)
8. **Response Generation**: LLM synthesizes tool results into actionable recommendations
9. **Streaming**: Stream response chunks to UI in real-time
10. **Storage**: Save interaction to database for future context

### Key Design Patterns

- **Tool-Based Architecture**: Modular tools that can be composed for complex queries
- **Streaming Responses**: Real-time feedback for better user experience
- **Context Awareness**: Maintains conversation history and user preferences
- **Error Handling**: Graceful degradation when external APIs fail
- **Caching**: Response caching for frequently asked questions

---

## Features and Capabilities

### 1. Pre-Sowing Planning

**Crop Recommendation (`getCropRecommendation`)**
- Analyzes location, soil type, season, and climate
- Recommends suitable crops with suitability scores
- Considers market demand and profitability
- Provides crop-specific requirements and constraints

**Sowing Calendar (`getSowingCalendar`)**
- Identifies optimal sowing windows based on:
  - Local weather patterns
  - Crop-specific requirements
  - Historical climate data
- Provides risk assessment for different sowing dates
- Suggests crop varieties suitable for the region

**Cost-Benefit Analysis (`getCostBenefitAnalysis`)**
- Estimates input costs (seeds, fertilizers, irrigation, labor)
- Projects expected yields and revenue
- Calculates profitability metrics
- Compares multiple crop options

### 2. Growth Phase Monitoring

**Soil Analysis (`getSoilAnalysis`)**
- Estimates soil moisture from weather data
- Provides nutrient recommendations
- Crop-specific soil requirements
- Irrigation recommendations based on moisture levels

**Irrigation Advisory (`getIrrigationAdvisory`)**
- Analyzes current weather conditions
- Considers crop water requirements by growth stage
- Recommends irrigation timing and quantity
- Accounts for forecasted rainfall

**Fertilizer Recommendation (`getFertilizerRecommendation`)**
- Crop-specific nutrient requirements
- Growth stage-based recommendations
- Soil type considerations
- Application timing and methods

**NDVI Monitoring (`getNDVI`)**
- Satellite-based vegetation health tracking
- Anomaly detection in crop growth
- Comparison with historical patterns
- Visual maps for field-level analysis

### 3. Yield Prediction & Harvest

**Yield Prediction (`getYieldPrediction`)**
- Forecasts expected yield with confidence intervals
- Considers:
  - Historical yield data
  - Current crop health (NDVI)
  - Weather conditions
  - Crop variety and management practices
- Provides uncertainty bounds

**Harvest Timing (`getHarvestTiming`)**
- Identifies optimal harvest window
- Considers:
  - Crop maturity indicators
  - Weather forecasts
  - Market price trends
- Risk assessment for delayed harvest
- Quality vs. quantity trade-offs

### 4. Post-Harvest Market Advisory

**Mandi Price Data (`getMandiPrice`)**
- Real-time prices from Indian agricultural markets
- Price comparison across multiple markets
- Historical price trends
- Commodity-specific data

**Price Trend Analysis (`getPriceTrendAnalysis`)**
- Short-term price forecasting
- Trend identification (increasing/decreasing)
- Optimal selling timing recommendations
- Market comparison for best returns
- Risk assessment for storage vs. immediate sale

### 5. General Features

**Weather Information (`getWeather`)**
- Current conditions
- 7-day forecasts
- Historical data
- Location-specific data

**Interactive Maps**
- Location selection for queries
- NDVI visualization
- Field boundary drawing
- Regional crop data display

**Conversational Interface**
- Natural language queries
- Context-aware responses
- Multi-turn conversations
- Follow-up suggestions

---

## Data Sources and Integration

### 1. Google Earth Engine

**Purpose**: Satellite imagery and NDVI calculations

**Integration:**
- Uses Sentinel-2 and Landsat data
- Calculates NDVI for vegetation health monitoring
- Provides satellite embeddings for land cover classification
- Real-time data access via GEE Python API

**Data Format:**
- ImageCollection with temporal filtering
- Point and polygon-based queries
- Cloud-free composite generation

### 2. Open-Meteo API

**Purpose**: Weather forecasts and historical data

**Integration:**
- REST API for global weather data
- Hourly and daily forecasts
- Historical data access
- Multiple weather variables (temperature, precipitation, humidity)

**Usage:**
- Irrigation advisory
- Sowing calendar recommendations
- Soil moisture estimation
- Harvest timing decisions

### 3. Digital Soil Map of the World (FAO-UNESCO)

**Purpose**: Soil type and characteristics

**Integration:**
- Vector shapefile data
- Global coverage at 1:5,000,000 scale
- Soil classification and properties
- Spatial queries for location-based soil data

**Usage:**
- Crop suitability analysis
- Fertilizer recommendations
- Soil-specific management advice

### 4. Agmarknet / eNAM

**Purpose**: Indian agricultural market prices

**Integration:**
- Daily price data from mandis
- Commodity-specific prices
- Market-wise price comparison
- Historical price trends
- SQLite database for local caching

**Usage:**
- Real-time price queries
- Market trend analysis
- Selling recommendations

### 5. Nominatim (OpenStreetMap)

**Purpose**: Geocoding and reverse geocoding

**Integration:**
- REST API for location queries
- Converts place names to coordinates
- Administrative boundary information
- Address parsing

**Usage:**
- Location validation
- Market location mapping
- Regional data queries

### 6. Database (PostgreSQL)

**Purpose**: User data, chat history, context storage

**Schema:**
- Users: Authentication and profiles
- Chats: Conversation sessions
- Messages: Chat messages with tool calls
- Suggestions: AI-generated follow-ups

---

## AI Tools and Functions

### Tool Architecture

Each tool follows a consistent pattern:
1. **Input Schema**: Zod schema for type-safe parameters
2. **Description**: Natural language description for LLM tool selection
3. **Validation**: Location bounds, parameter validation
4. **Execution**: API calls, data processing, calculations
5. **Response**: Structured JSON with recommendations

### Tool Categories

#### Pre-Sowing Tools (3 tools)
1. **getCropRecommendation**: Analyzes location, soil, climate to recommend crops
2. **getSowingCalendar**: Identifies optimal sowing windows
3. **getCostBenefitAnalysis**: Financial planning and profitability

#### Growth Phase Tools (4 tools)
4. **getSoilAnalysis**: Soil moisture and nutrient analysis
5. **getIrrigationAdvisory**: Irrigation scheduling
6. **getFertilizerRecommendation**: Nutrient management
7. **getNDVI**: Satellite-based vegetation health

#### Harvest Phase Tools (2 tools)
8. **getYieldPrediction**: Yield forecasting
9. **getHarvestTiming**: Optimal harvest window

#### Post-Harvest Tools (2 tools)
10. **getMandiPrice**: Real-time market prices
11. **getPriceTrendAnalysis**: Price trends and selling advice

#### General Tools (2 tools)
12. **getWeather**: Weather data and forecasts
13. **getCropData**: Regional crop information

### Tool Orchestration

The LLM (Gemini 2.5 Pro) intelligently selects and orchestrates tools:
- **Single Tool Queries**: Direct tool calls for specific questions
- **Multi-Tool Queries**: Parallel execution of multiple tools for comprehensive analysis
- **Sequential Tool Calls**: Tools that depend on previous tool results
- **Context-Aware Selection**: Uses conversation history to select appropriate tools

### Example Tool Usage

**Query**: "Should I irrigate my wheat field today?"

**Tool Orchestration:**
1. `getWeather` - Current conditions and forecast
2. `getSoilAnalysis` - Current soil moisture
3. `getIrrigationAdvisory` - Crop-specific water requirements

**Response**: Synthesized recommendation with reasoning

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **Maps**: Leaflet with React-Leaflet
- **State Management**: React hooks, SWR for data fetching
- **Streaming**: AI SDK streaming utilities

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **LLM**: Google Gemini 2.5 Pro via AI SDK
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Caching**: Redis (optional, for resumable streams)

### AI & ML
- **LLM Provider**: Google Gemini 2.5 Pro
- **AI SDK**: Vercel AI SDK for tool calling and streaming
- **Tool Framework**: Zod for schema validation
- **Embeddings**: Google Earth Engine satellite embeddings

### Data Sources
- **Weather**: Open-Meteo REST API
- **Satellite**: Google Earth Engine Python API
- **Soil**: FAO-UNESCO Digital Soil Map
- **Market**: Agmarknet/eNAM (SQLite database)
- **Geocoding**: Nominatim REST API

### Development Tools
- **Language**: TypeScript
- **Linting**: Biome
- **Testing**: Playwright for E2E tests
- **Package Manager**: pnpm
- **Version Control**: Git

### Deployment
- **Platform**: Vercel (recommended)
- **Database**: PostgreSQL (Vercel Postgres or external)
- **Environment**: Production-ready configuration

---

## Testing and Validation

### Test Coverage

#### E2E Tests (Playwright)
- **Chat Functionality**: Message sending, streaming, tool calls
- **Artifacts**: Document creation and editing
- **Authentication**: Login, registration, session management
- **Reasoning**: LLM reasoning capabilities

#### Unit Tests
- Tool validation and error handling
- Data processing functions
- API response parsing

### Validation Approach

1. **Tool Validation**: Each tool tested with various inputs
2. **Integration Testing**: End-to-end query flows
3. **Error Handling**: Graceful degradation when APIs fail
4. **Performance**: Response time and streaming latency
5. **User Testing**: Sample queries from real farmer scenarios

### Known Limitations

1. **Soil Data**: Currently uses weather-based estimation; actual soil tests recommended
2. **Market Data**: Limited to available Agmarknet data
3. **NDVI**: Requires cloud-free satellite imagery
4. **Location**: Some tools limited to India (validated by coordinates)
5. **Real-time Updates**: Market prices may have delays

---

## Challenges and Solutions

### Challenge 1: Integrating Multiple Data Sources

**Problem**: Different APIs with varying formats, rate limits, and reliability

**Solution**:
- Standardized tool interface with consistent error handling
- Caching layer for frequently accessed data
- Graceful degradation when APIs fail
- Validation and bounds checking for all inputs

### Challenge 2: LLM Tool Selection

**Problem**: Ensuring LLM selects correct tools for user queries

**Solution**:
- Detailed tool descriptions with usage examples
- System prompts with clear tool usage guidelines
- Few-shot examples in prompts
- Context-aware tool selection based on conversation history

### Challenge 3: Real-time Streaming

**Problem**: Providing immediate feedback while processing complex queries

**Solution**:
- Server-Sent Events (SSE) for streaming
- Progressive response generation
- Tool result streaming as available
- Optimistic UI updates

### Challenge 4: Location Validation

**Problem**: Ensuring tools work only for valid locations (e.g., India for mandi prices)

**Solution**:
- Coordinate bounds validation in each tool
- Clear error messages for invalid locations
- Geocoding validation for place names
- User-friendly location selection via maps

### Challenge 5: Context Management

**Problem**: Maintaining conversation context across multiple turns

**Solution**:
- Database storage of chat history
- Context retrieval from previous messages
- User profile and preferences storage
- Smart context assembly for LLM prompts

---

## Future Enhancements

### Short-term (Next 3-6 months)

1. **Multilingual Support**
   - Hindi, Marathi, Telugu, and other Indian languages
   - Voice input/output integration
   - Regional terminology support

2. **Enhanced Soil Data**
   - Integration with actual soil test results
   - Soil health scoring
   - Nutrient deficiency detection

3. **Pest and Disease Detection**
   - Image-based pest identification
   - Disease symptom recognition
   - Treatment recommendations

4. **Mobile App**
   - React Native application
   - Offline capabilities
   - Push notifications for alerts

### Medium-term (6-12 months)

1. **Machine Learning Models**
   - Custom yield prediction models
   - Crop disease prediction
   - Price forecasting models

2. **Farmer Community Features**
   - Knowledge sharing
   - Best practice recommendations
   - Success stories

3. **Integration with IoT Sensors**
   - Real-time soil moisture sensors
   - Weather station data
   - Automated irrigation control

4. **Advanced Analytics**
   - Field performance tracking
   - Comparative analysis with other farmers
   - ROI calculations

### Long-term (12+ months)

1. **Blockchain Integration**
   - Transparent market transactions
   - Supply chain tracking
   - Fair pricing mechanisms

2. **Government Integration**
   - Subsidy information
   - Scheme eligibility
   - Direct benefit transfer

3. **Financial Services**
   - Crop insurance recommendations
   - Loan eligibility assessment
   - Financial planning tools

4. **Research and Development**
   - Collaboration with agricultural universities
   - Model improvement through farmer feedback
   - Publication of research findings

---

## Conclusion

AgroSense represents a comprehensive solution to the challenges faced by smallholder farmers in India. By integrating multiple data sources, leveraging advanced AI capabilities, and providing a user-friendly interface, the platform addresses critical gaps in agricultural advisory services.

### Key Achievements

1. **Complete Implementation**: Full-stack application with all planned features
2. **Comprehensive Tool Library**: 15+ specialized tools covering entire crop lifecycle
3. **Data Integration**: Successfully integrated 6+ external data sources
4. **Production Ready**: Deployable system with proper error handling and validation
5. **Scalable Architecture**: Modular design allowing easy extension

### Impact Potential

- **Farmers**: Access to timely, location-specific agricultural advice
- **Agricultural Sector**: Improved decision-making leading to better yields
- **Market Efficiency**: Better price discovery and market access
- **Sustainability**: Optimized resource use (water, fertilizers)

### Lessons Learned

1. **Tool-Based Architecture**: Modular tools enable flexible, composable solutions
2. **Context is Key**: Maintaining conversation context significantly improves responses
3. **Error Handling**: Graceful degradation is essential when dealing with external APIs
4. **User Experience**: Streaming responses and immediate feedback improve perceived performance
5. **Validation**: Input validation and bounds checking prevent errors and improve reliability

### Final Thoughts

AgroSense demonstrates the potential of AI-powered agricultural advisory systems. While there are opportunities for enhancement (multilingual support, mobile apps, advanced ML models), the current implementation provides a solid foundation for supporting farmers across all phases of crop management.

The project successfully combines:
- **Technology**: Modern web stack with AI capabilities
- **Data**: Multiple sources for comprehensive insights
- **Domain Knowledge**: Agricultural best practices and Indian context
- **User-Centric Design**: Accessible, conversational interface

With continued development and farmer feedback, AgroSense has the potential to significantly impact agricultural productivity and farmer livelihoods in India and beyond.

---

## Appendix

### A. Tool Reference

Complete list of implemented tools with descriptions:

1. `getCropRecommendation` - Crop suitability analysis
2. `getSowingCalendar` - Optimal sowing window identification
3. `getCostBenefitAnalysis` - Financial planning
4. `getSoilAnalysis` - Soil health assessment
5. `getIrrigationAdvisory` - Irrigation scheduling
6. `getFertilizerRecommendation` - Nutrient management
7. `getNDVI` - Vegetation health monitoring
8. `getYieldPrediction` - Yield forecasting
9. `getHarvestTiming` - Harvest window recommendations
10. `getMandiPrice` - Market price data
11. `getPriceTrendAnalysis` - Price trends and selling advice
12. `getWeather` - Weather information
13. `getCropData` - Regional crop information

### B. API Endpoints

- `POST /api/chat` - Main chat endpoint with streaming
- `GET /api/auth/*` - Authentication endpoints
- Database queries via Drizzle ORM

### C. Database Schema

- **users**: User accounts and profiles
- **chats**: Conversation sessions
- **messages**: Chat messages with metadata
- **suggestions**: AI-generated follow-up suggestions

### D. Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini API key
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `REDIS_URL` - Optional Redis for caching

### E. Deployment Instructions

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `pnpm db:migrate`
4. Build application: `pnpm build`
5. Deploy to Vercel or similar platform