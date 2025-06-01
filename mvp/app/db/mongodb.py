from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from pymongo.collection import Collection
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "incident_analysis")

# Collections
INCIDENTS_COLLECTION = "incidents"
TABLE_METADATA_COLLECTION = "table_metadata"
LOGS_COLLECTION = "logs"
LLM_ANALYSIS_COLLECTION = "llm_analysis"
HUMAN_REVIEWS_COLLECTION = "human_reviews"
RECOMMENDATIONS_COLLECTION = "recommendations"

# MongoDB client instance
client: AsyncIOMotorClient = None
db: Database = None

async def connect_to_mongodb():
    """Connect to MongoDB."""
    global client, db
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[MONGODB_DB]
        print(f"Connected to MongoDB at {MONGODB_URL}, database: {MONGODB_DB}")

async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client is not None:
        client.close()
        client = None
        print("Closed MongoDB connection")

def get_collection(collection_name: str) -> Collection:
    """Get a MongoDB collection by name."""
    return db[collection_name]

def get_incidents_collection() -> Collection:
    """Get the incidents collection."""
    return get_collection(INCIDENTS_COLLECTION)

def get_table_metadata_collection() -> Collection:
    """Get the table metadata collection."""
    return get_collection(TABLE_METADATA_COLLECTION)

def get_logs_collection() -> Collection:
    """Get the logs collection."""
    return get_collection(LOGS_COLLECTION)

def get_llm_analysis_collection() -> Collection:
    """Get the LLM analysis collection."""
    return get_collection(LLM_ANALYSIS_COLLECTION)

def get_human_reviews_collection() -> Collection:
    """Get the human reviews collection."""
    return get_collection(HUMAN_REVIEWS_COLLECTION)

def get_recommendations_collection() -> Collection:
    """Get the recommendations collection."""
    return get_collection(RECOMMENDATIONS_COLLECTION)
