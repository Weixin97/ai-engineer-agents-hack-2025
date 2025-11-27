from bson import ObjectId
import json
from datetime import datetime
from typing import Any


class MongoJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB objects."""
    
    def default(self, obj: Any) -> Any:
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def jsonable_encoder(obj: Any) -> Any:
    """Convert an object to a JSON-compatible format."""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: jsonable_encoder(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [jsonable_encoder(i) for i in obj]
    else:
        return obj
