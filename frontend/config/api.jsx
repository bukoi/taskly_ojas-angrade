import axios from 'axios';

export const API_URL = "http://localhost:8000";

let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => {
    return accessToken;
};

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic for auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            if (!refreshPromise) {
                refreshPromise = axios
                    .post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
                    .then(res => {
                        setAccessToken(res.data.access_token);
                        return res.data.access_token;
                    })
                    .finally(() => { refreshPromise = null; });
            }

            try {
                const newToken = await refreshPromise;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                accessToken = null;
                // Only redirect if we are not already on the login page to prevent loops
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
