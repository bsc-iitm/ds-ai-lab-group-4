"""
CSV Question Answering System using LangChain and OpenAI.

This module provides functionality to perform question-answering on CSV data
using retrieval-augmented generation (RAG) with OpenAI's language models.
"""

import os
import sys
import logging
from pathlib import Path
from typing import List, Tuple

import pandas as pd
from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


def load_csv_data(csv_path: str) -> List[Document]:
    """
    Load CSV file and convert each row to a LangChain Document.
    
    Args:
        csv_path: Path to the CSV file
        
    Returns:
        List of Document objects
    """
    logger.info(f"Loading CSV from: {csv_path}")
    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {len(df)} rows with {len(df.columns)} columns")
    
    documents = []
    for idx, row in df.iterrows():
        content_parts = []
        for col in df.columns:
            value = row[col]
            if pd.notna(value):
                content_parts.append(f"{col}: {value}")
        
        content = "\n".join(content_parts)
        row_idx = int(idx) if isinstance(idx, (int, float)) else 0
        metadata = {"row_index": row_idx, "source": csv_path}
        
        for col in df.columns:
            if pd.notna(row[col]):
                metadata[col] = str(row[col])
        
        documents.append(Document(page_content=content, metadata=metadata))
    
    return documents


def create_vectorstore(documents: List[Document], embeddings) -> FAISS:
    """
    Create FAISS vectorstore from documents.
    
    Args:
        documents: List of Document objects
        embeddings: Embedding model instance
        
    Returns:
        FAISS vectorstore instance
    """
    logger.info("Creating vector store...")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    
    split_docs = text_splitter.split_documents(documents)
    logger.info(f"Split into {len(split_docs)} chunks")
    
    vectorstore = FAISS.from_documents(split_docs, embeddings)
    logger.info("Vector store created successfully")
    
    return vectorstore


def create_qa_chain(vectorstore, llm) -> Tuple:
    """
    Create a RAG chain using LangChain Expression Language (LCEL).
    
    Args:
        vectorstore: FAISS vectorstore instance
        llm: Language model instance
        
    Returns:
        Tuple of (rag_chain, retriever)
    """
    template = """You are a helpful assistant analyzing market and commodity data. Used by farmers to predict the prices of crops and related informations.
Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.


Context:
{context}

Question: {question}

Helpful Answer:"""
    
    prompt = ChatPromptTemplate.from_template(template)
    
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
    
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return rag_chain, retriever


def main():
    """Main function to run the CSV QA system."""
    
    # Verify API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY not found in environment variables")
        print("\nError: OPENAI_API_KEY not configured")
        print("Please set your OpenAI API key:")
        print("  PowerShell: $env:OPENAI_API_KEY='your-key-here'")
        print("  Or create a .env file with: OPENAI_API_KEY=your-key-here")
        sys.exit(1)
    
    # Locate CSV files
    data_folder = Path(__file__).parent / "data"
    csv_files = list(data_folder.glob("*.csv"))
    
    if not csv_files:
        logger.error(f"No CSV files found in {data_folder}")
        print(f"\nError: No CSV files found in {data_folder}")
        sys.exit(1)
    
    # Select CSV file
    if len(csv_files) == 1:
        csv_path = csv_files[0]
        logger.info(f"Using CSV file: {csv_path.name}")
    else:
        print(f"\nFound {len(csv_files)} CSV files:")
        for i, f in enumerate(csv_files, 1):
            print(f"  {i}. {f.name}")
        choice = input("\nSelect file number (default: 1): ").strip()
        idx = int(choice) - 1 if choice.isdigit() else 0
        csv_path = csv_files[idx]
    
    # Load data
    documents = load_csv_data(str(csv_path))
    
    # Initialize models
    logger.info("Initializing OpenAI models...")
    embeddings = OpenAIEmbeddings()
    llm = ChatOpenAI(model="gpt-5", temperature=0.7)
    logger.info("Models initialized")
    
    # Create vectorstore and QA chain
    vectorstore = create_vectorstore(documents, embeddings)
    qa_chain, retriever = create_qa_chain(vectorstore, llm)
    
    
    
    while True:
        try:
            question = input("\nQuestion: ").strip()
            
            if not question:
                continue
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("\nGoodbye!")
                break
            
            logger.info(f"Processing question: {question}")
            
            # Retrieve and generate answer
            relevant_docs = retriever.invoke(question)
            answer = qa_chain.invoke(question)
            
            print("\n" + "-" * 70)
            print("Answer:")
            print("-" * 70)
            print(answer)
            print("-" * 70)
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            logger.error(f"Error processing question: {str(e)}", exc_info=True)
            print(f"\nError: {str(e)}")
            print("Please try rephrasing your question or check your API key.")


if __name__ == "__main__":
    main()
