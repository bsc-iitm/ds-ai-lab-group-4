# CSV Question Answering with LangChain & OpenAI

This project enables interactive question-answering on CSV data using LangChain and OpenAI models. Ask natural language questions about your market data and get intelligent answers!

## 📋 Features

- **Natural Language Queries**: Ask questions in plain English
- **OpenAI Integration**: Uses GPT-3.5-turbo for intelligent responses
- **Vector Search**: FAISS vectorstore for efficient similarity search
- **Market Data Support**: Optimized for commodity and market price data
- **Interactive Mode**: Continuous Q&A session

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Set Your OpenAI API Key

**Option A: Environment Variable**
```powershell
$env:OPENAI_API_KEY = 'sk-your-api-key-here'
```

**Option B: .env File**
```powershell
Copy-Item .env.example .env
# Then edit .env and add your API key
```

### 3. Run the Script

```powershell
python csv_qa.py
```

The script will automatically load CSV files from the `data` folder.

## 💡 Example Questions

Try asking questions like:
- "What commodities are available in the data?"
- "What are the price ranges for Amla?"
- "Which district has the highest modal prices?"
- "Show me all data for Maharashtra"
- "What is the average price in Nashik?"
- "When was the last reported date?"

## 📁 Files

- `csv_qa.py` — Main script for interactive Q&A
- `requirements.txt` — Python dependencies
- `data/Final_Mandi_data_1.csv` — Sample market data
- `.env.example` — Template for environment variables

## 🔧 How It Works

1. **Load CSV**: Reads CSV data and converts each row to a document
2. **Create Embeddings**: Uses OpenAI embeddings to vectorize the data
3. **Build Vector Store**: Creates FAISS index for fast similarity search
4. **Answer Questions**: Uses GPT-3.5-turbo with retrieval-augmented generation (RAG)

## 🛠️ Advanced Usage

### Using Different OpenAI Models

Edit `csv_qa.py` and change the model:
```python
llm = ChatOpenAI(model="gpt-4", temperature=0)
```

### Adjusting Retrieved Context

Modify the `k` value to return more/fewer relevant chunks:
```python
search_kwargs={"k": 5}  # Default is 5
```

## 📊 Data Format

The script works best with structured CSV data. Current data includes:
- State Name
- District Name
- Market Name
- Variety
- Group
- Arrivals (Tonnes)
- Min/Max/Modal Price (Rs./Quintal)
- Reported Date
- Grade
- Commodity Name

## 🎯 Next Steps

- Add support for multiple CSV files simultaneously
- Implement caching for faster repeated queries
- Add export functionality for Q&A sessions
- Support for custom prompt templates
- Add data visualization for numeric answers
