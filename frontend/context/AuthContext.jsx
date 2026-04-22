import { createContext, useContext, useState } from 'react';
import { authApi } from '../api/auth';
import { setAccessToken } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData, accessToken) => {
        setUser(userData);
        setAccessToken(accessToken);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    };

    const refreshSession = async () => {
        try {
            const data = await authApi.refresh();
            setUser(data.user);
            setAccessToken(data.access_token);
            return data.user;
        } catch (error) {
            setUser(null);
            setAccessToken(null);
            throw error;
        }
    };

    const resetPassword = async (data) => {
        try {
            await authApi.change_password(data);
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, setLoading, login, logout, refreshSession, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
