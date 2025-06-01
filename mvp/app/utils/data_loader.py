import json
import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.db.mongodb import (
    connect_to_mongodb,
    close_mongodb_connection,
    get_incidents_collection,
    get_table_metadata_collection,
    get_logs_collection
)


async def load_sample_data(data_dir: str):
    """Load sample data from JSON files into MongoDB."""
    print(f"Loading sample data from {data_dir}...")
    
    # Connect to MongoDB
    await connect_to_mongodb()
    
    try:
        # Load table metadata
        table_metadata_file = os.path.join(data_dir, "table_metadata_20250601_045332.json")
        if os.path.exists(table_metadata_file):
            with open(table_metadata_file, "r") as f:
                table_metadata = json.load(f)
                
            # Extract and transform table metadata
            for table_name, metadata in table_metadata.items():
                print(f"Loading metadata for table: {table_name}")
                await get_table_metadata_collection().update_one(
                    {"table_name": table_name},
                    {"$set": metadata},
                    upsert=True
                )
        
        # Load Airflow logs
        airflow_logs_file = os.path.join(data_dir, "airflow_logs_20250601_045332.json")
        if os.path.exists(airflow_logs_file):
            with open(airflow_logs_file, "r") as f:
                logs = json.load(f)
                
            # Insert logs
            if logs:
                print(f"Loading {len(logs)} Airflow logs")
                await get_logs_collection().insert_many(logs)
        
        # Load DQC logs
        dqc_logs_file = os.path.join(data_dir, "dqc_logs_20250601_045332.json")
        if os.path.exists(dqc_logs_file):
            with open(dqc_logs_file, "r") as f:
                dqc_logs = json.load(f)
                
            # Insert DQC logs
            if dqc_logs:
                print(f"Loading {len(dqc_logs)} DQC logs")
                await get_logs_collection().insert_many(dqc_logs)
        
        # Load mock incident data
        mock_incident_file = os.path.join(data_dir, "mock_incident_data_20250601_045332.json")
        if os.path.exists(mock_incident_file):
            with open(mock_incident_file, "r") as f:
                mock_data = json.load(f)
                
            # Extract scenarios and create incidents
            for scenario_name, scenario_data in mock_data.get("scenarios", {}).items():
                print(f"Creating incident from scenario: {scenario_name}")
                
                # Create incident from DQC log
                dqc_log = scenario_data.get("dqc_log", {})
                airflow_logs = scenario_data.get("airflow_logs", [])
                
                # Create alert from DQC log
                alert = {
                    "severity": dqc_log.get("severity"),
                    "check_type": dqc_log.get("check_type"),
                    "table": dqc_log.get("table"),
                    "time_period": dqc_log.get("time_period"),
                    "expected_value": dqc_log.get("expected_value"),
                    "actual_value": dqc_log.get("actual_value")
                }
                
                # Create incident
                incident = {
                    "alert": alert,
                    "status": "new",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "scenario_name": scenario_name,
                    "scenario_description": scenario_data.get("scenario_description")
                }
                
                # Insert incident
                result = await get_incidents_collection().insert_one(incident)
                print(f"Created incident with ID: {result.inserted_id}")
        
        print("Sample data loaded successfully!")
    
    except Exception as e:
        print(f"Error loading sample data: {e}")
    
    finally:
        # Close MongoDB connection
        await close_mongodb_connection()


if __name__ == "__main__":
    # Get data directory from command line or use default
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "/private/tmp/oo/ai-engineer-agents-hack-2025"
    
    # Run the data loader
    asyncio.run(load_sample_data(data_dir))
