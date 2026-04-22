import api, { setAccessToken } from "../config/api";

export const authApi = {
    register: async (user) => {
        const response = await api.post("/auth/register", user);
        // Store access token in memory
        setAccessToken(response.data.access_token);
        return response.data;
    },
    login: async (credentials) => {
        const response = await api.post("/auth/login", credentials);
        // Store access token in memory
        setAccessToken(response.data.access_token);
        return response.data;
    },
    refresh: async () => {
        const response = await api.post("/auth/refresh");
        setAccessToken(response.data.access_token);
        return response.data;
    },
    logout: async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setAccessToken(null);
            localStorage.removeItem('user');
        }
    },
    change_password: async (data) => {
        const response = await api.post("/auth/change-password", data);
        return response.data;
    },
};
