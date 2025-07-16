from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List 
import json
import logging 

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # incident_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(
        self, websocket: WebSocket, incident_id: str
    ):
        await websocket.accept()
        if incident_id not in self.active_connections:
            self.active_connections[incident_id] = []
        self.active_connections[incident_id].append(websocket)
        logger.info(f"WebSocket connected for incident {incident_id}")
        
    def disconnect(self, websocket: WebSocket, incident_id: str):
        if incident_id in self.active_connections:
            self.active_connections[incident_id].remove(websocket)
            if not self.active_connections[incident_id]:
                del self.active_connections[incident_id]
        logger.info(f"WebSocket disconnected for incident {incident_id}")

    async def send_personal_message(
        self, message: str, websocket: WebSocket
    ):
        await websocket.send_text(message)

    async def broadcast_to_incident(
        self, incident_id: str, message:dict
    ):
        if incident_id in self.active_connections:
            message_str = json.dumps(message)
            # send to all connections for this incidents
    
            for connection in self.active_connections[incident_id].copy():
                try:
                    await connection.send_text(message_str)
                except WebSocketDisconnect:
                    self.active_connections[incident_id].remove(connection)
            logger.info(f"Broadcasted message to {len(self.active_connections[incident_id])} connections for incident {incident_id}")

websocket_manager = ConnectionManager()
