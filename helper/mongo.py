from datetime import datetime
import os 
from dotenv import load_dotenv
load_dotenv()

MONGODB_URI = os.getenv('MONGODB_ATLAS_URI')
def save_incident_to_mongodb(final_report):
    """Save incident analysis to MongoDB Atlas for historical learning"""
    
    # MongoDB Atlas connection string (replace with your actual URI)

    try:
        from pymongo import MongoClient
        
        print("   🌐 Connecting to MongoDB Atlas cluster...")
        
        # Connect to Atlas with timeout for demo safety
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
        
        # Test connection
        client.admin.command('ping')
        print("   ✅ Connected to MongoDB Atlas successfully")
        
        db = client['incident_response_db']
        
        # Enhance report with Atlas-specific metadata
        atlas_document = {
            **final_report,
            "created_at": datetime.now().isoformat(),
            "agent_version": "v1.0-hackathon",
            "environment": "demo",
            "cluster_info": {
                "provider": "MongoDB Atlas",
                "region": "cloud",
                "tier": "free"
            },
            "confidence_score": extract_confidence_from_analysis(final_report),
            "learning_metadata": {
                "human_corrections": final_report.get('resolution', {}).get('human_validation', {}).get('action') == 'modify',
                "escalation_required": final_report.get('escalation_required', False),
                "complexity_score": calculate_complexity_score(final_report)
            }
        }
        
        # Save to Atlas
        collection = db.incidents
        result = collection.insert_one(atlas_document)
        print(f"   💾 Incident saved to Atlas: {result.inserted_id}")
        
        # Update learning metrics
        update_atlas_learning_metrics(db, final_report)
        
        # Close connection
        client.close()
        
    except ImportError:
        print("   📦 PyMongo not installed - run: pip install pymongo[srv]")
        print("   🏗️  In production: Would persist to MongoDB Atlas for global access")
    except Exception as e:
        print(f"   🔄 Atlas connection failed (expected in demo): {str(e)}")
        print("   ☁️  In production: Incident data would be stored in MongoDB Atlas")
        # print("   📊 Benefits: Global accessibility, automatic scaling, built-in security")

def update_atlas_learning_metrics(db, report):
    """Update agent learning metrics in Atlas"""
    try:
        action = report.get('resolution', {}).get('human_validation', {}).get('action', 'unknown')
        
        # Create a metrics document for Atlas
        metrics_doc = {
            "metric_type": "agent_performance",
            "timestamp": datetime.now().isoformat(),
            "incident_id": report.get('incident_id'),
            "decision": action,
            "confidence": extract_confidence_from_analysis(report),
            "escalated": report.get('escalation_required', False)
        }
        
        # Insert individual metric record
        db.learning_metrics.insert_one(metrics_doc)
        
        # Update aggregate counters
        db.performance_summary.update_one(
            {"summary_type": "daily_stats", "date": datetime.now().strftime("%Y-%m-%d")},
            {
                "$inc": {
                    f"decisions.{action}": 1,
                    "total_incidents": 1
                },
                "$set": {
                    "last_updated": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        print(f"   📊 Atlas learning metrics updated: {action} decision pattern stored")
        
    except Exception as e:
        print(f"   ⚠️  Atlas metrics update failed: {e}")

def extract_confidence_from_analysis(report):
    """Extract confidence score from LLM analysis"""
    try:
        analysis = report.get('technical_analysis', {}).get('root_cause', '')
        if 'Confidence level:' in analysis:
            conf_part = analysis.split('Confidence level:')[1].split('\n')[0]
            return conf_part.strip()
    except:
        pass
    return "Not specified"

def calculate_complexity_score(report):
    """Calculate incident complexity for learning"""
    score = 1
    if report.get('escalation_required'):
        score += 3
    if 'security' in str(report).lower() or 'corruption' in str(report).lower():
        score += 2
    if report.get('resolution', {}).get('human_validation', {}).get('action') == 'modify':
        score += 1
    return min(score, 5)

def update_learning_metrics(db, report):
    """Update agent learning metrics"""
    try:
        action = report.get('resolution', {}).get('human_validation', {}).get('action', 'unknown')
        
        # Track decision patterns for agent improvement
        db.agent_learning.update_one(
            {"metric_type": "decision_patterns"},
            {
                "$inc": {
                    f"total_{action}": 1,
                    "total_incidents": 1
                },
                "$set": {
                    "last_updated": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        print(f"   📊 Learning metrics updated: {action} decision tracked")
        
    except Exception as e:
        print(f"   ⚠️  Metrics update failed: {e}")