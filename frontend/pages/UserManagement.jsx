
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Search, Trash2, UserPlus, Shield, User, 
    ChevronLeft, ChevronRight, LayoutDashboard, LogOut,
    MoreVertical, ShieldCheck, Mail, Calendar, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/user';
import toast from "react-hot-toast";

export default function UserManagement() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [roleFilter, setRoleFilter] = useState('');
    
    const limit = 10;
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
        fetchStats();
    }, [page, search]);

    const fetchStats = async () => {
        try {
            const data = await userApi.getStats();
            setStats(data);
        } catch (error) {
            console.error("Stats fetch failed");
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = search 
                ? await userApi.searchUsers(search, page, limit)
                : await userApi.getUsers(page, limit);
            setUsers(data.data);
            setTotalUsers(data.total);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await userApi.updateRole(userId, newRole);
            toast.success(`Role updated to ${newRole}`);
            fetchUsers();
        } catch (error) {
            toast.error("Role update failed");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure? This will delete the user and all their tasks.")) return;
        try {
            await userApi.deleteUser(userId);
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedUsers.length} users?`)) return;
        try {
            await userApi.bulkDelete(selectedUsers);
            toast.success("Users deleted");
            setSelectedUsers([]);
            fetchUsers();
        } catch (error) {
            toast.error("Bulk deletion failed");
        }
    };

    const toggleSelectUser = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    if (!user || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <LayoutDashboard className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Admin Console</h1>
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border border-blue-500/20 ml-2">
                            User Management
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="hidden md:flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                        <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/5">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                        <div className="glass-card p-6 border-blue-500/10 hover:border-blue-500/30 transition-all group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
                                    <h3 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.total_users}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-6 border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Admins</p>
                                    <h3 className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors">{stats.admins}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-6 border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Tasks</p>
                                    <h3 className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors">{stats.total_tasks}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                                    <LayoutDashboard className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-6 border-purple-500/10 hover:border-purple-500/30 transition-all group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Completion</p>
                                    <h3 className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">
                                        {stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%
                                    </h3>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                    <Shield className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4 flex-1 w-full max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-400 outline-none focus:border-blue-500/50 hidden md:block"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="user">Users</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {selectedUsers.length > 0 && (
                            <button 
                                onClick={handleBulkDelete}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-500/20 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Selected ({selectedUsers.length})</span>
                            </button>
                        )}
                        <div className="bg-slate-900/50 border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>Total: <span className="text-white font-bold">{totalUsers}</span></span>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 w-12">
                                        <input 
                                            type="checkbox" 
                                            className="accent-blue-500 w-4 h-4 rounded border-white/10" 
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedUsers(users.map(u => u.id));
                                                else setSelectedUsers([]);
                                            }}
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-4 bg-white/5 rounded"></div></td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-white/5 rounded"></div>
                                                    <div className="h-3 w-48 bg-white/5 rounded"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><div className="h-6 w-20 bg-white/5 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-24 bg-white/5 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 w-8 bg-white/5 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : users.filter(u => !roleFilter || u.role === roleFilter).map(u => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <input 
                                                type="checkbox" 
                                                className="accent-blue-500 w-4 h-4 rounded border-white/10" 
                                                checked={selectedUsers.includes(u.id)}
                                                onChange={() => toggleSelectUser(u.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-600/20">
                                                    {u.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{u.full_name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {u.role === 'admin' ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                        <User className="w-3 h-3" />
                                                        User
                                                    </span>
                                                )}
                                                <button 
                                                    onClick={() => handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-blue-400 transition-all"
                                                    title="Toggle Role"
                                                >
                                                    <Filter className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500 font-medium">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-green-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                Active
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    disabled={u.id === user.id}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-0"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="px-6 py-4 bg-white/5 flex items-center justify-between border-t border-white/5">
                        <p className="text-xs text-slate-500">
                            Showing {users.length} of {totalUsers} users
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold w-8 text-center">{page}</span>
                            <button 
                                disabled={page * limit >= totalUsers}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-20 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
