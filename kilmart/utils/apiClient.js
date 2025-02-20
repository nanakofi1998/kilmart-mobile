import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://supermart-q7ed.onrender.com/api/', 
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' }
});

export default apiClient;