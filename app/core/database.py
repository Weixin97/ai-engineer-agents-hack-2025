import json 
import os 
from typing import Dict, Any, List 

class DataManager:
    def __init__(self, data_dir: str="app/static/data"):
        self.data_dir = data_dir
        self._table_metadata = None 
        self._airflow_logs = None
        self._dqc_logs = None 
    

    @property
    def table_metadata(self) -> Dict[str, Any]:
        if self._table_metadata is None:
            with open(os.path.join(self.data_dir, 'table_metadata_20250601_045332.json'), 'r') as f:
                self._table_metadata = json.load(f)
        return self._table_metadata
    
    @property
    def airflow_logs(self) -> List[Dict[str, Any]]:
        if self._airflow_logs is None:
            with open(os.path.join(self.data_dir, 'airflow_logs_20250601_045332.json'), 'r') as f:
                self._airflow_logs = json.load(f)
        return self._airflow_logs
    
    @property
    def dqc_logs(self) -> List[Dict[str, Any]]:
        if self._dqc_logs is None:
            with open(os.path.join(self.data_dir, 'dqc_logs_20250601_045332.json'), 'r') as f:
                self._dqc_logs = json.load(f)
        return self._dqc_logs