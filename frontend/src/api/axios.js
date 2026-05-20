import axios from 'axios';

const api = axios.create({
    baseURL: 'http://20.244.10.53:5001/api', // Explicitly hardcoded to remote VM
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to add the JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
