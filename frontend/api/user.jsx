import api from "../config/api";

export const userApi = {
    getUsers: async (page = 1, limit = 10) => {
        const response = await api.get(`/users/?page=${page}&limit=${limit}`);
        return response.data;
    },
    searchUsers: async (query, page = 1, limit = 10) => {
        const response = await api.get(`/users/search?query=${query}&page=${page}&limit=${limit}`);
        return response.data;
    },
    updateRole: async (userId, role) => {
        const response = await api.patch(`/users/${userId}/role?role=${role}`);
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
    },
    bulkDelete: async (userIds) => {
        const response = await api.delete("/users/bulk-delete", { data: { user_ids: userIds } });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get("/users/stats");
        return response.data;
    }
};
