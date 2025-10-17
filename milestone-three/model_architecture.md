# **AgroSense Model Architecture**
<img width="2436" height="1174" alt="image" src="https://github.com/user-attachments/assets/2015961b-5071-4b26-a527-604f137c3d71" />




### **1. Overview**

The architecture represents an LLM-powered system that provides personalized agricultural insights to farmers. It combines multiple data sources (like weather, soil, and market data) with a large language model (LLM) that interprets and delivers responses through a user-friendly interface.

---

### **2. Components and Flow**

#### **(a) Data Sources / Tools**

The system integrates several tools that provide domain-specific inputs:

* **Crop History** – past cropping patterns and yield data
* **NDVI (Normalized Difference Vegetation Index)** – vegetation health from satellite imagery
* **Soil Parameters** – pH, moisture, and nutrient levels
* **Weather Parameters** – temperature, rainfall, humidity, forecasts
* **Mandi Prices** – real-time and historical market prices

These tools serve as **data providers** or APIs that the LLM can call for context-specific information retrieval.

---

#### **(b) Large Language Model (LLM)**

* The **core reasoning engine** of the system.
* Receives the **user’s question** (e.g., “Should I irrigate my wheat crop this week?”) along with **context** (location, crop stage, soil data, etc.).
* Dynamically queries the tools above to fetch relevant information.
* Generates a **streaming response** (incremental chunks of output) for real-time conversational interaction.

---

#### **(c) Streaming Chunks & Parse Artifact**

* The LLM outputs results as **streaming chunks** partial responses sent progressively for responsiveness.
* These chunks are processed by the **Parse Artifact** module, which:

  * Converts the streamed text or structured output into usable artifacts (e.g., tables, graphs, or textual advisories).
  * Ensures the content is formatted appropriately for display on the front-end.

---

#### **(d) Front-End Service**

* The **user interface** (web or mobile app) through which the **farmer** interacts with the system.
* Displays responses from the LLM in a conversational format.
* Supports **multilingual and multimodal** interactions (e.g., voice/text).

---

#### **(e) Server Layer**

* Acts as the **middleware** between the front-end and the LLM.
* Handles:

  * Context assembly (merging user data, historical context, and environmental data before querying the LLM)
  * Communication with the database

---

#### **(f) Database**

* Stores:

  * **User history** (previous queries, interactions)
  * **Context settings** (e.g., user location, preferred language, crop type)
  * This allows the system to provide **personalized and contextual answers** over time.

---

#### **(g) Farmer Interaction Loop**

1. The farmer submits a query via the front-end.
2. The query goes to the **server**, which retrieves context from the **database**.
3. The **LLM** uses that context and calls relevant **tools**.
4. The **response** is streamed back, parsed, and displayed interactively to the farmer.

---

### **3. Key Features**

* **Continuous Context** – Each interaction builds on past sessions.
* **Tool Augmentation** – LLM dynamically fetches data via external APIs.
* **Real-time Conversation** – Streaming responses enhance interactivity.
* **Personalized Advisory** – Tailored insights for each farmer and crop lifecycle stage.

---

# User Story
## **The Farmer**

As a small holder farmer I want to receive simple, localized, and voice-based guidance at every stage of my crop lifecycle. So that I can make better decisions to maximize yield, reduce risk, and improve profitability.

---

## **User Stories by Lifecycle Stage**

---

### **1. Onboarding & Setup**

**Story 1.1**
As a farmer, I want to enter my location or allow GPS detection,
so that the system can automatically identify my agro-climatic zone.

**Story 1.2**
As a farmer, I want to draw or confirm my field boundaries (or accept auto-detected ones),
so that I can monitor only my specific fields.

**Story 1.3**
As a farmer, I want to provide details like past crops, soil type, and irrigation access,
so that AgroSense can give more accurate and tailored advice.

---

### **2. Pre-Sowing Planning**

**Story 2.1**
As a farmer, I want to ask “Which crop should I plant this season?”
so that I can choose crops best suited to my soil and climate.

**Story 2.2**
As a farmer, I want to know the best sowing window,
so that I can optimize yield potential based on local weather patterns.

**Story 2.3**
As a farmer, I want to compare expected yield and profit for different crops,
so that I can make an informed decision balancing risk and reward.

---

### **3. Sowing & Early Growth**

**Story 3.1**
As a farmer, I want to monitor how well my crop is germinating using satellite imagery,
so that I can detect uneven growth early.

**Story 3.2**
As a farmer, I want to receive alerts when parts of my field show poor vegetation indices (NDVI),
so that I can take corrective action before it spreads.

**Story 3.3**
As a farmer, I want to speak or type “Is the soil too dry?” and get an immediate answer,
so that I can adjust irrigation before damage occurs.

---

### **4. Mid-Season Monitoring & Advisory**

**Story 4.1**
As a farmer, I want to know whether my crop shows signs of nutrient deficiency or water stress,
so that I can apply fertilizer or water precisely when needed.

**Story 4.2**
As a farmer, I want AgroSense to ask clarifying questions (e.g., “Do you see yellowing?”),
so that the diagnosis can become more accurate.

**Story 4.3**
As a farmer, I want to receive actionable, step-by-step recommendations (e.g., quantity, timing, type of fertilizer),
so that I can implement them easily and safely.

---

### **5. Yield Forecasting & Harvest Timing**

**Story 5.1**
As a farmer, I want to get a forecast of my expected yield with a confidence range,
so that I can plan my finances and logistics.

**Story 5.2**
As a farmer, I want the system to suggest the best harvest window,
so that I can harvest when quality and yield are optimal.

**Story 5.3**
As a farmer, I want to simulate scenarios (“If I delay harvest 5 days, what happens?”),
so that I can make informed trade-offs.

---

### **6. Post-Harvest & Market Advisory**

**Story 6.1**
As a farmer, I want to check real-time mandi prices and nearby market trends,
so that I can decide when and where to sell.

**Story 6.2**
As a farmer, I want AgroSense to predict short-term price changes,
so that I can plan storage or sale timing strategically.

**Story 6.3**
As a farmer, I want to compare expected profit between selling now and later,
so that I can make financially sound decisions.

---

### **7. Review & Feedback Loop**

**Story 7.1**
As a farmer, I want to enter my actual yield and field observations,
so that the system can improve its accuracy for future seasons.

**Story 7.2**
As a farmer, I want to visualize performance zones on my field map,
so that I can understand which areas performed well or poorly.

**Story 7.3**
As a farmer, I want AgroSense to summarize learnings and suggest improvements for next season,
so that I continuously enhance my practices.

---

## **Cross-Cutting Functional Stories**

**Story 8.1 — Multilingual Support**
As a farmer, I want to communicate in my local language via voice or text,
so that I can use the app comfortably regardless of literacy level.

**Story 8.2 — Explainability**
As a farmer, I want the system to explain *why* it is giving a recommendation,
so that I can trust and understand the advice.


