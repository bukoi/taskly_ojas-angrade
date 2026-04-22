import api from "../config/api";

export const taskApi = {
    getTasks: async (page = 1, limit = 10) => {
        const response = await api.get(`/tasks/?page=${page}&limit=${limit}`);
        return response.data;
    },
    getAllTasks: async (params = {}) => {
        const { owner_id, query, status, priority, page = 1, limit = 10 } = params;
        let url = `/tasks/all?page=${page}&limit=${limit}`;
        if (owner_id) url += `&owner_id=${owner_id}`;
        if (query) url += `&query=${query}`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;
        const response = await api.get(url);
        return response.data;
    },
    createTask: async (data) => {
        const response = await api.post("/tasks/", data);
        return response.data;
    },
    createTaskForUser: async (userId, data) => {
        const response = await api.post(`/tasks/admin/create-task/${userId}`, data);
        return response.data;
    },
    updateTask: async (data) => {
        const response = await api.patch("/tasks/", data);
        return response.data;
    },
    deleteTask: async (id) => {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    },
    searchTasks: async (query, page = 1, limit = 10) => {
        const response = await api.get(`/tasks/search?query=${query}&page=${page}&limit=${limit}`);
        return response.data;
    },
    filterTasks: async (params = {}) => {
        const { status, priority, page = 1, limit = 10 } = params;
        let url = `/tasks/filter?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;
        const response = await api.get(url);
        return response.data;
    },
    getStats: async () => {
        const response = await api.get("/tasks/stats");
        return response.data;
    },
    bulkUpdate: async (tasks) => {
        const response = await api.patch("/tasks/bulk-update", { tasks });
        return response.data;
    }
};
