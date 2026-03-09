import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useDragControls } from 'motion/react';
import { Plus, Check, X, GripHorizontal, Link as LinkIcon } from 'lucide-react';

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

const TaskCard = ({
  task,
  updatePosition,
  updateTitle,
  addSubtask,
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
            <span className={`flex-1 text-sm ${st.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {st.text}
            </span>
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
            
            // Calculate hanging curve
            const dx = Math.abs(x2 - x1);
            const cx = (x1 + x2) / 2;
            const cy = Math.max(y1, y2) + dx * 0.15 + 40;
            const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
            
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
          
          // Calculate hanging curve for active line
          const dx = Math.abs(x2 - x1);
          const cx = (x1 + x2) / 2;
          const cy = Math.max(y1, y2) + dx * 0.15 + 40;
          const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
          
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
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('sticky-tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: '1',
        title: 'Welcome!',
        x: 100,
        y: 100,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        subtasks: [
          { id: crypto.randomUUID(), text: 'Drag me around by the header', done: false },
          { id: crypto.randomUUID(), text: 'Add new pending items below', done: false },
          { id: crypto.randomUUID(), text: 'Click the circle to complete', done: true }
        ]
      },
      {
        id: '2',
        title: 'Connections',
        x: 500,
        y: 200,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        subtasks: [
          { id: crypto.randomUUID(), text: 'Click the link icon in the header', done: false },
          { id: crypto.randomUUID(), text: 'Then click another note to connect', done: false },
          { id: crypto.randomUUID(), text: 'Click a line to delete it', done: false }
        ]
      }
    ];
  });

  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem('sticky-connections');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [{ id: crypto.randomUUID(), from: '1', to: '2' }];
  });

  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('sticky-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sticky-connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    if (!connectingFrom) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [connectingFrom]);

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
      }}
    >
      <ConnectionsLayer 
        connections={connections} 
        tasks={tasks} 
        connectingFrom={connectingFrom} 
        mousePos={mousePos}
        deleteConnection={deleteConnection}
      />

      <button
        onClick={(e) => { e.stopPropagation(); addTask(); }}
        className="absolute top-6 left-6 z-50 bg-black text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-800 transition-colors font-medium"
      >
        <Plus size={20} /> New Note
      </button>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          updatePosition={updatePosition}
          updateTitle={updateTitle}
          addSubtask={addSubtask}
          toggleSubtask={toggleSubtask}
          deleteTask={deleteTask}
          deleteSubtask={deleteSubtask}
          onConnectStart={handleConnectStart}
          onNoteClick={handleNoteClick}
          isConnectingFrom={connectingFrom === task.id}
          isConnectingTarget={connectingFrom !== null && connectingFrom !== task.id}
        />
      ))}
    </div>
  );
}
