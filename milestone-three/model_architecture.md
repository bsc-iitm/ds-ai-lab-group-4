# **AgroSense Model Architecture**
<img width="2436" height="1174" alt="image" src="https://github.com/user-attachments/assets/2015961b-5071-4b26-a527-604f137c3d71" />

### **1. Overview**

The architecture represents an LLM-powered system that provides personalized agricultural insights to farmers. It combines multiple data sources (like weather, soil, and market data) with a large language model (LLM) that interprets and delivers responses through a user-friendly interface.

### **Detailed System Architecture Diagram**

```mermaid
graph TD
    subgraph Client["Client Layer"]
        Farmer["Farmer User"]
        UI["Mobile/Web UI"]
    end
    
    subgraph API["API Layer"]
        REST["REST API Endpoint"]
        Auth["Authentication<br/>Authorization"]
    end
    
    subgraph Server["Server Layer - Request Processing"]
        QueryParser["Query Parser<br/>Intent Extraction<br/>Parameter Identification"]
        ContextRetriever["Context Retriever<br/>Fetch User Profile<br/>Load Preferences"]
        ContextAssembler["Context Assembler<br/>Merge User Data<br/>Build Context Object"]
        PromptOrchestrator["Prompt Orchestrator<br/>Construct System Prompt<br/>Format Instructions"]
        ResponseFormatter["Response Formatter<br/>Structure Output<br/>Format for UI"]
        ErrorHandler["Error Handler<br/>Exception Management<br/>Fallback Logic"]
    end
    
    subgraph DBLayer["Database Layer"]
        UserDB["User Profile DB<br/>ID, Location, Language<br/>Farm Details"]
        HistoryDB["Query History DB<br/>Past Queries<br/>Responses"]
        ContextDB["Context Settings DB<br/>Crop Type<br/>Farm Size"]
        CacheDB["Cache Storage<br/>Query Cache<br/>Tool Results"]
    end
    
    subgraph LLMLayer["LLM Processing Layer"]
        LLMModel["Large Language Model<br/>Core Reasoning Engine"]
        ToolCaller["Tool Caller<br/>Generate Tool Calls<br/>Parameter Mapping"]
        StreamProcessor["Stream Processor<br/>Handle Streamed Output<br/>Chunk Management"]
        ArtifactParser["Artifact Parser<br/>Parse LLM Output<br/>Extract Insights"]
    end
    
    subgraph DataTools["External Data Sources & Tools"]
        CropHistoryAPI["Crop History API<br/>Past Yields<br/>Cropping Patterns"]
        NDVIService["NDVI Service<br/>Satellite Imagery<br/>Vegetation Index"]
        SoilDataAPI["Soil Parameters API<br/>pH, Moisture<br/>Nutrients"]
        WeatherAPI["Weather API<br/>Temperature<br/>Rainfall, Forecast"]
        MandiPricesAPI["Mandi Prices API<br/>Market Data<br/>Price History"]
    end
    
    subgraph Cache["Caching Layer"]
        ResponseCache["Response Cache<br/>Stores Formatted<br/>Responses"]
        ToolCache["Tool Results Cache<br/>Caches API<br/>Responses"]
    end
    
    Farmer -->|1. Submit Query| UI
    UI -->|2. HTTP Request| REST
    REST -->|3. Validate Credentials| Auth
    Auth -->|4. Route to Parser| QueryParser
    QueryParser -->|5. Extract Intent| ContextRetriever
    
    ContextRetriever -->|6. Query User DB| UserDB
    ContextRetriever -->|7. Query Context DB| ContextDB
    ContextRetriever -->|8. Query History DB| HistoryDB
    
    UserDB -->|User Data| ContextAssembler
    ContextDB -->|Settings| ContextAssembler
    HistoryDB -->|History| ContextAssembler
    
    ContextAssembler -->|9. Merged Context| PromptOrchestrator
    PromptOrchestrator -->|10. System Prompt| LLMModel
    
    LLMModel -->|11. Analyze Query| LLMModel
    LLMModel -->|12. Decide Tools| ToolCaller
    
    ToolCaller -->|13. Check Cache| ToolCache
    ToolCache -->|Cache Hit| ToolCaller
    ToolCache -->|Cache Miss| ToolCaller
    
    ToolCaller -->|14a. Call Weather API| WeatherAPI
    ToolCaller -->|14b. Call Soil API| SoilDataAPI
    ToolCaller -->|14c. Call Crop History| CropHistoryAPI
    ToolCaller -->|14d. Call NDVI Service| NDVIService
    ToolCaller -->|14e. Call Mandi API| MandiPricesAPI
    
    WeatherAPI -->|15. Weather Data| StreamProcessor
    SoilDataAPI -->|15. Soil Data| StreamProcessor
    CropHistoryAPI -->|15. History Data| StreamProcessor
    NDVIService -->|15. NDVI Data| StreamProcessor
    MandiPricesAPI -->|15. Price Data| StreamProcessor
    
    StreamProcessor -->|16. Cache Results| ToolCache
    StreamProcessor -->|17. Stream Chunks| ArtifactParser
    ArtifactParser -->|18. Parse Output| ResponseFormatter
    
    ResponseFormatter -->|19. Format Response| ResponseCache
    ResponseCache -->|20. Cache| CacheDB
    ResponseFormatter -->|21. Stream Response| REST
    
    REST -->|22. Send Chunks| UI
    UI -->|23. Display Response| Farmer
    
    PromptOrchestrator -->|24. Store Query| HistoryDB
    
    ErrorHandler -.->|Error Recovery| Server
```

### **LLM Model Selection**

#### **Google Gemini 2.5 Pro**
- **Strengths**: 
  - Advanced multimodal reasoning (text, images, video)
  - Excellent context understanding with long context window
  - Strong performance on agricultural and domain-specific tasks
  - Cost-effective pricing
  - Native support for function calling and tool use
- **Latency**: ~1.5-2.5 seconds average response
- **Use Case**: Complex agricultural reasoning, multi-turn conversations, image analysis for crop health
- **Features**:
  - Supports 1 million token context window
  - Real-time function calling for tool orchestration
  - Structured output for consistent response formatting

---

### **Detailed Server Layer Operations**

#### **1. Query Parser Module**
```
Input: Raw user query (text/voice)
Process:
  - Tokenize and normalize input
  - Identify intent (e.g., "should I irrigate?", "what's the best crop?")
  - Extract entities (crop name, field location, time period)
  - Detect context switches or follow-ups
Output: Structured query object with intent and parameters
```

#### **2. Context Retriever Module**
```
Input: Structured query, User ID
Process:
  - Query User Profile DB: farmer_id, location (lat/long), language
  - Query Context DB: current_crop, farm_size, irrigation_method, soil_type
  - Query History DB: last_5_queries, conversation_context
  - Build context cache for current session
Output: Complete user context object
```

#### **3. Context Assembler Module**
```
Input: Raw query, User context, Historical data
Process:
  - Merge user profile with current request
  - Add historical interaction context
  - Include current crop lifecycle stage
  - Attach environmental constraints
Output: Unified context object ready for LLM
```

#### **4. Prompt Orchestrator Module**
```
Input: Assembled context, User query
Process:
  - Build system prompt with:
    * Role definition: "You are an agricultural advisor for Indian farmers"
    * Available tools and descriptions
    * Output format instructions (JSON, markdown, etc.)
    * User preferences (language, detail level)
  - Add few-shot examples for better responses
  - Include domain-specific constraints
Output: Complete system prompt sent to LLM
```

#### **5. Response Formatter Module**
```
Input: Parsed LLM output, Tool results
Process:
  - Convert raw LLM text to structured format
  - Validate recommendations against farm constraints
  - Create visual artifacts (tables, charts)
  - Localize content to user language
  - Add confidence scores to recommendations
Output: Formatted response ready for UI display
```

---

### **System Prompts Examples**

#### **System Prompt Template 1: Weather-Based Irrigation**
```
You are an expert agricultural advisor for Indian farms. The farmer has the following setup:
- Location: {latitude, longitude} - {city}, {state}
- Crop: {crop_name}, Stage: {growth_stage}
- Farm Size: {area_hectares} hectares
- Soil Type: {soil_type}, Current Moisture: {soil_moisture}%
- Last Irrigation: {days_ago} days ago
- Current Weather: {temperature}°C, Humidity: {humidity}%, Rain Forecast: {rainfall}mm

Available Tools:
1. get_weather_forecast(lat, lon, days) - Returns 7-day forecast
2. get_soil_moisture(field_id) - Current soil moisture level
3. get_crop_water_requirement(crop, stage) - Water needs for growth stage

Task: Answer the farmer's question about irrigation with actionable insights.
Response Format: JSON with keys: recommendation, reasoning, actions, warnings
```

#### **System Prompt Template 2: Market Price Advisory**
```
You are a market analyst for agricultural commodities. The farmer grows {crop_name}.
- Region: {region_name}
- Expected Harvest: {harvest_date}
- Typical Yield: {kg_per_hectare}

Available Tools:
1. get_mandi_prices(crop, region, days) - Historical prices
2. get_market_trend(crop, duration) - Price trends
3. get_competitor_prices(crop, region) - Competitor pricing

Task: Provide market insights and optimal selling strategies.
Response Format: JSON with keys: current_price, predicted_price, best_time_to_sell, risks
```


