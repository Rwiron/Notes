import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useDragControls } from 'motion/react';
import { Plus, Check, X, GripHorizontal, Link as LinkIcon, LogOut, User, Folder, ChevronDown, Edit2, Trash2, AlertTriangle, Users } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  username?: string;
}

interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  x: number;
  y: number;
  createdAt?: string;
  subtasks: Subtask[];
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface AdminUserStat {
  username: string;
  projectCount: number;
}

interface AdminStats {
  totalUsers: number;
  users: AdminUserStat[];
}

const TaskCard = ({
  task,
  updatePosition,
  updateTitle,
  addSubtask,
  updateSubtask,
  toggleSubtask,
  deleteTask,
  deleteSubtask,
  onConnectStart,
  onNoteClick,
  isConnectingFrom,
  isConnectingTarget
}: {
  task: Task;
  updatePosition: (id: string, x: number, y: number) => void;
  updateTitle: (id: string, title: string) => void;
  addSubtask: (taskId: string, text: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, text: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  onConnectStart: (id: string) => void;
  onNoteClick: (id: string) => void;
  isConnectingFrom: boolean;
  isConnectingTarget: boolean;
}) => {
  const [newSubtask, setNewSubtask] = useState('');
  const x = useMotionValue(task.x);
  const y = useMotionValue(task.y);
  const dragControls = useDragControls();

  return (
    <motion.div
      id={`note-${task.id}`}
      style={{ x, y, position: 'absolute' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={() => updatePosition(task.id, x.get(), y.get())}
      onClick={(e) => { e.stopPropagation(); onNoteClick(task.id); }}
      className={`w-72 bg-white rounded-2xl shadow-xl border flex flex-col overflow-hidden z-10 ${isConnectingFrom ? 'ring-2 ring-blue-500 border-blue-500' : isConnectingTarget ? 'ring-2 ring-green-500 border-green-500 cursor-crosshair' : 'border-black/5'}`}
    >
      {/* Drag Handle Area */}
      <div
        className="bg-amber-50/80 p-3 border-b border-black/5 flex items-start justify-between cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
         <div className="flex items-start gap-2 flex-1">
            <GripHorizontal size={16} className="text-gray-400 pointer-events-none mt-1" />
            <div className="flex flex-col w-full">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5 select-none">
                {task.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTitle(task.id, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-transparent font-semibold text-gray-800 outline-none w-full leading-tight"
                placeholder="Note Title..."
              />
            </div>
         </div>
         <button
           onPointerDown={(e) => e.stopPropagation()}
           onClick={(e) => { e.stopPropagation(); onConnectStart(task.id); }}
           className={`text-gray-400 hover:text-blue-500 transition-colors ml-2 ${isConnectingFrom ? 'text-blue-500' : ''}`}
           title="Connect to another note"
         >
           <LinkIcon size={16} />
         </button>
         <button
           onPointerDown={(e) => e.stopPropagation()}
           onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
           className="text-gray-400 hover:text-red-500 transition-colors ml-2"
         >
           <X size={16} />
         </button>
      </div>

      {/* Subtasks Area */}
      <div className="p-3 flex flex-col gap-2">
        {task.subtasks.map(st => (
          <div key={st.id} className="flex items-start gap-2 group">
            <button
              onClick={(e) => { e.stopPropagation(); toggleSubtask(task.id, st.id); }}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${st.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}
            >
              {st.done && <Check size={12} strokeWidth={3} />}
            </button>
            <input
              type="text"
              value={st.text}
              onChange={(e) => updateSubtask(task.id, st.id, e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 text-sm bg-transparent outline-none ${st.done ? 'line-through text-gray-400' : 'text-gray-700'}`}
            />
            <button onClick={(e) => { e.stopPropagation(); deleteSubtask(task.id, st.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Add Subtask Input */}
        <form onSubmit={(e) => { e.preventDefault(); if(newSubtask.trim()) { addSubtask(task.id, newSubtask.trim()); setNewSubtask(''); } }} className="mt-2 flex items-center gap-2">
          <Plus size={16} className="text-gray-400" />
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add a pending item..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
        </form>
      </div>
    </motion.div>
  );
};

const ConnectionsLayer = ({ connections, tasks, connectingFrom, mousePos, deleteConnection }: { connections: Connection[], tasks: Task[], connectingFrom: string | null, mousePos: {x: number, y: number}, deleteConnection: (id: string) => void }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateLines = () => {
      if (!svgRef.current) return;
      const lines = svgRef.current.querySelectorAll('.connection-line');
      
      connections.forEach((conn, index) => {
        const el1 = document.getElementById(`note-${conn.from}`);
        const el2 = document.getElementById(`note-${conn.to}`);
        if (el1 && el2) {
          const rect1 = el1.getBoundingClientRect();
          const rect2 = el2.getBoundingClientRect();
          
          const x1 = rect1.left + rect1.width / 2;
          const y1 = rect1.top + rect1.height / 2;
          const x2 = rect2.left + rect2.width / 2;
          const y2 = rect2.top + rect2.height / 2;

          const lineGroup = lines[index];
          if (lineGroup) {
            const visibleLine = lineGroup.querySelector('.visible-line');
            const hitArea = lineGroup.querySelector('.hit-area');
            
            // Calculate fluid hanging curve (Cubic Bezier)
            const distance = Math.hypot(x2 - x1, y2 - y1);
            const sag = Math.max(distance * 0.2, 40);
            const pathData = `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`;
            
            if (visibleLine) {
              visibleLine.setAttribute('d', pathData);
            }
            if (hitArea) {
              hitArea.setAttribute('d', pathData);
            }
          }
        }
      });

      if (connectingFrom) {
        const activeLine = svgRef.current.querySelector('.active-connection-line');
        const el1 = document.getElementById(`note-${connectingFrom}`);
        if (activeLine && el1) {
          const rect1 = el1.getBoundingClientRect();
          const x1 = rect1.left + rect1.width / 2;
          const y1 = rect1.top + rect1.height / 2;
          const x2 = mousePos.x;
          const y2 = mousePos.y;
          
          // Calculate fluid hanging curve for active line (Cubic Bezier)
          const distance = Math.hypot(x2 - x1, y2 - y1);
          const sag = Math.max(distance * 0.2, 40);
          const pathData = `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`;
          
          activeLine.setAttribute('d', pathData);
        }
      }

      animationFrameId = requestAnimationFrame(updateLines);
    };

    updateLines();
    return () => cancelAnimationFrame(animationFrameId);
  }, [connections, tasks, connectingFrom, mousePos]);

  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'drop-shadow(0px 6px 4px rgba(0,0,0,0.15))' }}>
      {connections.map(conn => (
        <g 
          key={conn.id} 
          className="connection-line group pointer-events-auto" 
          style={{ cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'red\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Ccircle cx=\'6\' cy=\'6\' r=\'3\'/%3E%3Ccircle cx=\'6\' cy=\'18\' r=\'3\'/%3E%3Cline x1=\'20\' y1=\'4\' x2=\'8.12\' y2=\'15.88\'/%3E%3Cline x1=\'14.47\' y1=\'14.48\' x2=\'20\' y2=\'20\'/%3E%3Cline x1=\'8.12\' y1=\'8.12\' x2=\'12\' y2=\'12\'/%3E%3C/svg%3E") 12 12, pointer' }}
          onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id); }}
        >
          <path
            className="hit-area stroke-transparent fill-none"
            strokeWidth="20"
          />
          <path
            className="visible-line transition-colors duration-200 stroke-gray-600 group-hover:stroke-red-500 fill-none"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      ))}
      {connectingFrom && (
        <path
          className="active-connection-line stroke-blue-500 fill-none"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('sticky-token'));
  const [username, setUsername] = useState<string>('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(data => {
          setUsername(data.username);
          return fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
        })
        .then(res => res.json())
        .then(data => {
          setProjects(data);
          if (data.length > 0) {
            setCurrentProjectId(data[0].id);
          }
          setIsAuthReady(true);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('sticky-token');
          setIsAuthReady(true);
        });
    } else {
      setIsAuthReady(true);
    }
  }, [token]);

  useEffect(() => {
    if (username === 'wiron' && token) {
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.totalUsers !== undefined) {
            setAdminStats(data);
          }
        })
        .catch(err => console.error('Failed to fetch admin stats', err));
    }
  }, [username, token]);

  useEffect(() => {
    if (!currentProjectId || !token) return;
    fetch(`/api/projects/${currentProjectId}/state`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.tasks && data.tasks.length > 0) {
          setTasks(data.tasks);
        } else {
          setTasks([{
            id: crypto.randomUUID(),
            title: 'Welcome to ' + (projects.find(p => p.id === currentProjectId)?.name || 'Project') + '!',
            x: 100,
            y: 100,
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subtasks: [
              { id: crypto.randomUUID(), text: 'Drag me around by the header', done: false },
              { id: crypto.randomUUID(), text: 'Add new pending items below', done: false },
              { id: crypto.randomUUID(), text: 'Click the circle to complete', done: true }
            ]
          }]);
        }
        if (data.connections) setConnections(data.connections);
      });
  }, [currentProjectId, token]);

  useEffect(() => {
    if (!isAuthReady || !token || !currentProjectId) return;
    const timeout = setTimeout(() => {
      fetch(`/api/projects/${currentProjectId}/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tasks, connections })
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [tasks, connections, isAuthReady, token, currentProjectId]);

  useEffect(() => {
    if (!connectingFrom) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [connectingFrom]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`/api/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('sticky-token', data.token);
      setToken(data.token);
      setUsername(data.username);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setToken(null);
    setUsername('');
    setTasks([]);
    setConnections([]);
    setProjects([]);
    setCurrentProjectId(null);
    localStorage.removeItem('sticky-token');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !token) return;
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newProjectName.trim() })
    });
    const data = await res.json();
    setProjects([...projects, data]);
    setCurrentProjectId(data.id);
    setNewProjectName('');
    setIsProjectsMenuOpen(false);
  };

  const startEditingProject = (p: Project) => {
    setEditingProjectId(p.id);
    setEditProjectName(p.name);
  };

  const saveProjectEdit = async (id: string) => {
    if (!editProjectName.trim() || !token) return;
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editProjectName.trim() })
    });
    setProjects(projects.map(p => p.id === id ? { ...p, name: editProjectName.trim() } : p));
    setEditingProjectId(null);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete || !token || deleteConfirmText !== projectToDelete.name) return;
    await fetch(`/api/projects/${projectToDelete.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(projects.filter(p => p.id !== projectToDelete.id));
    if (currentProjectId === projectToDelete.id) {
      setCurrentProjectId(null);
      setTasks([]);
      setConnections([]);
    }
    setProjectToDelete(null);
    setDeleteConfirmText('');
  };

  const addTask = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: '',
      x: window.innerWidth / 2 - 144,
      y: window.innerHeight / 2 - 100,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      subtasks: []
    };
    setTasks([...tasks, newTask]);
  };

  const updatePosition = (id: string, x: number, y: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, x, y } : t));
  };

  const updateTitle = (id: string, title: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, title } : t));
  };

  const addSubtask = (taskId: string, text: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [...t.subtasks, { id: crypto.randomUUID(), text, done: false }]
        };
      }
      return t;
    }));
  };

  const updateSubtask = (taskId: string, subtaskId: string, text: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, text } : st)
        };
      }
      return t;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, done: !st.done } : st)
        };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.filter(st => st.id !== subtaskId)
        };
      }
      return t;
    }));
  };

  const handleConnectStart = (id: string) => {
    if (connectingFrom === id) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(id);
    }
  };

  const handleNoteClick = (id: string) => {
    if (connectingFrom) {
      if (connectingFrom !== id) {
        const exists = connections.some(c => 
          (c.from === connectingFrom && c.to === id) || 
          (c.from === id && c.to === connectingFrom)
        );
        if (!exists) {
          setConnections([...connections, { id: crypto.randomUUID(), from: connectingFrom, to: id }]);
        }
      }
      setConnectingFrom(null);
    }
  };

  const deleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  if (!isAuthReady) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F09F]">Loading...</div>;
  }

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F09F] relative" style={{ backgroundImage: 'radial-gradient(#e5df8d 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-black/5 z-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Sticky Notes</h1>
          <p className="text-gray-500 text-center mb-8">Sign in to sync your workspace</p>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                required
                value={authForm.username}
                onChange={e => setAuthForm({...authForm, username: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
            
            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
            
            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors mt-2">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <p className="text-center mt-6 text-sm text-gray-500">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-blue-600 font-medium hover:underline">
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-hidden relative"
      style={{
        backgroundColor: '#F6F09F',
        backgroundImage: 'radial-gradient(#e5df8d 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
      onClick={() => {
        if (connectingFrom) setConnectingFrom(null);
        setIsProjectsMenuOpen(false);
        setIsUsersMenuOpen(false);
      }}
    >
      <ConnectionsLayer 
        connections={connections} 
        tasks={tasks} 
        connectingFrom={connectingFrom} 
        mousePos={mousePos}
        deleteConnection={deleteConnection}
      />

      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsProjectsMenuOpen(!isProjectsMenuOpen); }} 
            className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-black/5 flex items-center gap-2 font-medium text-gray-800 hover:bg-white transition-colors"
          >
            <Folder size={18} className="text-blue-500" />
            {(() => {
              const currentProject = projects.find(p => p.id === currentProjectId);
              if (!currentProject) return 'Select a Project';
              return (
                <>
                  {currentProject.name}
                  {currentProject.username && currentProject.username !== username && (
                    <span className="text-xs text-gray-400 ml-1">({currentProject.username})</span>
                  )}
                </>
              );
            })()}
            <ChevronDown size={16} className="text-gray-400 ml-1" />
          </button>
          
          {isProjectsMenuOpen && (
            <div 
              className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-black/5 overflow-hidden z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
                {projects.length === 0 && (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center italic">
                    No projects yet
                  </div>
                )}
                {projects.map(p => (
                  <div key={p.id} className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${p.id === currentProjectId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
                    {editingProjectId === p.id ? (
                      <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          value={editProjectName}
                          onChange={e => setEditProjectName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveProjectEdit(p.id);
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          className="flex-1 px-2 py-1 text-sm rounded border border-blue-300 outline-none bg-white"
                        />
                        <button onClick={() => saveProjectEdit(p.id)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                        <button onClick={() => setEditingProjectId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setCurrentProjectId(p.id); setIsProjectsMenuOpen(false); }}
                          className="flex-1 text-left truncate px-1 py-0.5"
                        >
                          {p.name}
                          {p.username && p.username !== username && (
                            <span className="text-xs text-gray-400 ml-1">({p.username})</span>
                          )}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => startEditingProject(p)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { setProjectToDelete(p); setDeleteConfirmText(''); setIsProjectsMenuOpen(false); }} className="p-1 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <form onSubmit={handleCreateProject} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newProjectName} 
                    onChange={e => setNewProjectName(e.target.value)} 
                    placeholder="New project..." 
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button type="submit" disabled={!newProjectName.trim()} className="bg-black text-white p-1.5 rounded-lg disabled:opacity-50 hover:bg-gray-800 transition-colors">
                    <Plus size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {currentProjectId && (
          <button
            onClick={(e) => { e.stopPropagation(); addTask(); }}
            className="bg-black text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus size={20} /> New Note
          </button>
        )}
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-black/5">
        {username === 'wiron' && adminStats !== null && (
          <>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsUsersMenuOpen(!isUsersMenuOpen); setIsProjectsMenuOpen(false); }}
                className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <Users size={16} />
                <span className="text-sm font-bold">{adminStats.totalUsers} Users</span>
                <ChevronDown size={14} className="text-indigo-400" />
              </button>

              {isUsersMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden z-[100]" onClick={e => e.stopPropagation()}>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User Projects
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {adminStats.users.map(u => (
                      <div key={u.username} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium text-gray-700 truncate pr-2">{u.username}</span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full min-w-[24px] text-center">
                          {u.projectCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
          </>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <User size={16} />
          <span className="text-sm font-medium">{username}</span>
        </div>
        <div className="w-px h-4 bg-gray-300"></div>
        <button
          onClick={(e) => { e.stopPropagation(); handleLogout(); }}
          className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {!currentProjectId && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-black/5 text-center pointer-events-auto max-w-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder size={32} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Project Selected</h2>
            <p className="text-gray-500 mb-6">Create a new project from the top-left menu to start adding notes.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsProjectsMenuOpen(true); }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors w-full"
            >
              Create Project
            </button>
          </div>
        </div>
      )}

      {currentProjectId && tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          updatePosition={updatePosition}
          updateTitle={updateTitle}
          addSubtask={addSubtask}
          updateSubtask={updateSubtask}
          toggleSubtask={toggleSubtask}
          deleteTask={deleteTask}
          deleteSubtask={deleteSubtask}
          onConnectStart={handleConnectStart}
          onNoteClick={handleNoteClick}
          isConnectingFrom={connectingFrom === task.id}
          isConnectingTarget={connectingFrom !== null && connectingFrom !== task.id}
        />
      ))}

      {projectToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setProjectToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-bold">Delete Project</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{projectToDelete.name}</strong>? This action cannot be undone and will permanently delete all notes inside it.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please type <strong>{projectToDelete.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={projectToDelete.name}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={deleteConfirmText !== projectToDelete.name}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
