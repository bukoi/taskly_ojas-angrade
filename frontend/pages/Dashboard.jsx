
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard, LogOut, Search, Plus, Trash2, CheckCircle2,
    Circle, Clock, AlertCircle, ChevronLeft, ChevronRight, User as UserIcon,
    Filter, MoreVertical, Users, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../api/task';
import { userApi } from '../api/user';
import toast from "react-hot-toast";

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();

    // Common State
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [taskPage, setTaskPage] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'pending' });
    const [taskSearch, setTaskSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    // Admin Specific State
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPage, setUserPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const isAdmin = user?.role === 'admin';
    const limit = 10;

    useEffect(() => {
        if (isAdmin) {
            fetchUsers().then(() => {
                const userIdParam = searchParams.get('user_id');
                if (userIdParam) {
                    // Try to find in already loaded users or fetch if needed
                    // For now, if we just came from User Management, it's easier to just fetch that specific user if possible
                    // Or just let fetchUsers handle the list and we find it there.
                }
            });
        }
        fetchTasks();
    }, [user, userPage, taskPage, selectedUser, taskSearch, filterStatus, filterPriority]);

    useEffect(() => {
        const userIdParam = searchParams.get('user_id');
        if (isAdmin && userIdParam && users.length > 0) {
            const foundUser = users.find(u => u.id === userIdParam);
            if (foundUser) setSelectedUser(foundUser);
        }
    }, [users, searchParams]);

    const fetchTasks = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            let data;

            // Logic:
            // 1. Global Feed (Admin only)
            const isGlobalView = isAdmin && selectedUser === 'all';
            // 2. Viewing someone else (Admin only)
            const isViewingOthers = isAdmin && selectedUser && typeof selectedUser === 'object' && selectedUser.id !== user.id;
            
            if (isGlobalView) {
                data = await taskApi.getAllTasks({ page: taskPage, limit });
            } else if (isViewingOthers) {
                data = await taskApi.getAllTasks({
                    owner_id: selectedUser.id,
                    page: taskPage,
                    limit
                });
            } else if (taskSearch) {
                data = await taskApi.searchTasks(taskSearch, taskPage, limit);
            } else if (filterStatus || filterPriority) {
                data = await taskApi.filterTasks({
                    status: filterStatus,
                    priority: filterPriority,
                    page: taskPage,
                    limit
                });
            } else {
                // Default: Own tasks (Standard user or Admin viewing self/none)
                data = await taskApi.getTasks(taskPage, limit);
            }

            setTasks(data.data);
            setTotalTasks(data.total);
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchUsers = async (query = '') => {
        try {
            const data = query
                ? await userApi.searchUsers(query, userPage, limit)
                : await userApi.getUsers(userPage, limit);
            setUsers(data.data);
            setTotalUsers(data.total);
        } catch (error) {
            toast.error("Failed to load users");
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            if (isAdmin && selectedUser && typeof selectedUser === 'object' && selectedUser.id !== user.id) {
                await taskApi.createTaskForUser(selectedUser.id, newTask);
                toast.success(`Task assigned to ${selectedUser.full_name.split(' ')[0]}`);
            } else {
                await taskApi.createTask(newTask);
                toast.success("Task created");
            }
            setIsCreating(false);
            setNewTask({ title: '', description: '', priority: 'medium', status: 'pending' });
            fetchTasks(true);
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await taskApi.deleteTask(id);
            toast.success("Task deleted");
            fetchTasks(true);
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const handleToggleStatus = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await taskApi.updateTask({ task_id: task.id, status: newStatus });
            fetchTasks(true);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await taskApi.updateTask({ task_id: taskId, ...updates });
            toast.success("Task updated");
            fetchTasks(true);
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await userApi.updateRole(userId, newRole);
            toast.success(`Role updated to ${newRole}`);
            fetchUsers(userSearch);
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <LayoutDashboard className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Taskly</h1>
                        {isAdmin && (
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border border-blue-500/20 ml-2">
                                Admin Portal
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {isAdmin && (
                            <button
                                onClick={() => navigate('/admin/users')}
                                className="hidden md:flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                Manage Users
                            </button>
                        )}
                        <div className="hidden md:block text-right mr-2">
                            <p className="text-sm font-medium text-white">{user.full_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/5">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Admin Sidebar */}
                {isAdmin && (
                    <aside className="w-80 border-r border-white/5 bg-slate-900/30 flex flex-col hidden lg:flex">
                        <div className="p-4 border-b border-white/5">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value);
                                        fetchUsers(e.target.value);
                                    }}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            <button 
                                onClick={() => setSelectedUser('all')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${selectedUser === 'all' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Global Feed</span>
                            </button>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-4 ${!selectedUser || (selectedUser && selectedUser.id === user.id) ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
                            >
                                <UserIcon className="w-4 h-4" />
                                <span>My Tasks</span>
                            </button>
                            <div className="px-3 pt-4 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">User Directory</div>
                            {users.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${selectedUser?.id === u.id ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                            {u.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="text-left">
                                            <p className="truncate w-32 font-medium">{u.full_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] text-slate-600 truncate w-20">{u.email}</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin');
                                                    }}
                                                    className="text-[9px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/5 text-slate-500 uppercase transition-all"
                                                >
                                                    Set {u.role === 'admin' ? 'User' : 'Admin'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedUser?.id === u.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>}
                                </div>
                            ))}
                        </div>
                        {/* User Pagination */}
                        <div className="p-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Page {userPage}</span>
                            <div className="flex gap-1">
                                <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                                <button disabled={userPage * limit >= totalUsers} onClick={() => setUserPage(p => p + 1)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </aside>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-950/20 p-6 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Hero Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">
                                    {isAdmin && selectedUser === 'all' ? 'Global Feed' : isAdmin && selectedUser && typeof selectedUser === 'object' && selectedUser.id !== user.id ? `Tasks for ${(selectedUser.full_name || 'User').split(' ')[0]}` : 'Your Tasks'}
                                </h2>
                                <p className="text-slate-400 mt-1">Manage, track and complete your daily goals.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsCreating(!isCreating)}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>New Task</span>
                                </button>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={isAdmin && selectedUser && typeof selectedUser === 'object' ? `Search ${(selectedUser.full_name || 'User').split(' ')[0]}'s tasks...` : "Search tasks..."}
                                    value={taskSearch}
                                    onChange={(e) => setTaskSearch(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-400 outline-none focus:border-blue-500/50"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="in_progress">In Progress</option>
                                </select>
                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-400 outline-none focus:border-blue-500/50"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        {/* Creation Form */}
                        {isCreating && (
                            <form onSubmit={handleCreateTask} className="glass-card p-6 border-blue-500/20 animate-fade-in">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">
                                            {isAdmin && selectedUser && typeof selectedUser === 'object' && selectedUser.id !== user.id ? `Assign to ${selectedUser.full_name.split(' ')[0]}` : 'New Task'}
                                        </h3>
                                        <button type="button" onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Task Title</label>
                                        <input
                                            required
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 outline-none"
                                            placeholder="What needs to be done?"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description (Optional)</label>
                                        <textarea
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 outline-none h-24 resize-none"
                                            placeholder="Add some details..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Priority</label>
                                            <select
                                                value={newTask.priority}
                                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 outline-none text-slate-400"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Status</label>
                                            <select
                                                value={newTask.status}
                                                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500/50 outline-none text-slate-400"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all">
                                            {isAdmin && selectedUser && typeof selectedUser === 'object' && selectedUser.id !== user.id ? `Assign to ${selectedUser.full_name.split(' ')[0]}` : 'Create Task'}
                                        </button>
                                        <button type="button" onClick={() => setIsCreating(false)} className="px-6 bg-white/5 hover:bg-white/10 text-slate-400 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Tasks List */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-slate-500 text-sm font-medium">Syncing with cloud...</p>
                            </div>
                        ) : tasks.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {tasks.map(task => (
                                    <div key={task.id} className="glass-card p-5 group hover:border-white/20 transition-all flex items-start gap-4">
                                        <button
                                            onClick={() => handleToggleStatus(task)}
                                            className={`mt-1 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-slate-600 hover:text-blue-500'}`}
                                        >
                                            {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold text-lg truncate ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                                                {task.title}
                                            </h3>
                                            <p className={`text-sm mt-1 line-clamp-2 ${task.status === 'completed' ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {task.description || 'No description provided.'}
                                            </p>
                                            {isAdmin && selectedUser === 'all' && task.owner && (
                                                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 w-fit px-2 py-1 rounded-md border border-white/5">
                                                    <UserIcon className="w-3 h-3 text-blue-400" />
                                                    <span className="text-slate-400">Assigned to:</span>
                                                    <span className="text-white">{task.owner.full_name || task.owner.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-transparent outline-none focus:border-blue-500/50 transition-all ${task.status === 'completed' ? 'text-green-400 border-green-500/20' :
                                                            task.status === 'in_progress' ? 'text-yellow-400 border-yellow-500/20' :
                                                                'text-slate-500 border-white/10'
                                                        }`}
                                                >
                                                    <option value="pending" className="bg-slate-900">Pending</option>
                                                    <option value="in_progress" className="bg-slate-900">In Progress</option>
                                                    <option value="completed" className="bg-slate-900">Completed</option>
                                                </select>

                                                {isAdmin ? (
                                                    <select
                                                        value={task.priority}
                                                        onChange={(e) => handleUpdateTask(task.id, { priority: e.target.value })}
                                                        className="bg-slate-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded outline-none focus:border-blue-500/50 transition-all text-blue-400"
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                ) : (
                                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${task.priority === 'high' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                                                            task.priority === 'medium' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                                                                'text-slate-400 border-white/10 bg-white/5'
                                                        }`}>
                                                        {task.priority}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Delete Task"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Task Pagination */}
                                <div className="flex items-center justify-between pt-6">
                                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                                        Showing {tasks.length} of {totalTasks} tasks
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={taskPage === 1}
                                            onClick={() => setTaskPage(p => p - 1)}
                                            className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Prev
                                        </button>
                                        <button
                                            disabled={taskPage * limit >= totalTasks}
                                            onClick={() => setTaskPage(p => p + 1)}
                                            className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-24 glass-card border-dashed border-white/10">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-white/5 mb-4">
                                    <AlertCircle className="w-8 h-8 text-slate-700" />
                                </div>
                                <h3 className="text-xl font-bold text-white">No tasks found</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                    {isAdmin && selectedUser ? "This user hasn't created any tasks yet." : "Get started by creating your first task today!"}
                                </p>
                                {!isAdmin && (
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="mt-6 text-blue-400 hover:text-blue-300 font-bold text-sm flex items-center gap-2 mx-auto transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Create Task
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

