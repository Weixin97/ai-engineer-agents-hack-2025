import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('API_BASE_URL:', API_BASE_URL)
class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
  }

  async getIncidents() {
    try {
      console.log('Fetching incidents from:', `${API_BASE_URL}/api/incidents`);
      const response = await this.client.get('/api/incidents');
      console.log('Incidents response:', response.data);
      return response.data.incidents || [];
    } catch (error) {
      console.error('Failed to fetch incidents: ', error);
      throw error;
    }
    
  }

  async getIncident(incidentId) {
    const response = await this.client.get(`/api/incidents/${incidentId}`);
    return response.data;
  }

  async createIncident(alert) {
    const response = await this.client.post('/api/incidents', alert);
    return response.data;
  }

  async submitReview(incidentId, review) {
    const response = await this.client.post(`/api/incidents/${incidentId}/review`, review);
    return response.data;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

const apiService = new ApiService();
export {apiService};
export default apiService;