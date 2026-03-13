import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';

const db = new Database('app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS user_state (
    user_id TEXT PRIMARY KEY,
    tasks TEXT,
    connections TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS project_state (
    project_id TEXT PRIMARY KEY,
    tasks TEXT,
    connections TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

const app = express();
app.use(express.json());

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token) as any;
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(session.user_id) as any;
  req.userId = session.user_id;
  req.username = user ? user.username : null;
  next();
};

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(id, username, password);
    const token = crypto.randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, id);
    
    res.json({ token, username });
  } catch (e) {
    res.status(400).json({ error: 'Username taken' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = crypto.randomUUID();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
  res.json({ token, username: user.username });
});

app.get('/api/me', authenticate, (req: any, res: any) => {
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.userId) as any;
  res.json({ username: user.username });
});

app.get('/api/admin/stats', authenticate, (req: any, res: any) => {
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.userId) as any;
  if (user.username !== 'wiron') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const users = db.prepare(`
    SELECT u.username, COUNT(p.id) as projectCount
    FROM users u
    LEFT JOIN projects p ON u.id = p.user_id
    GROUP BY u.id
    ORDER BY projectCount DESC, u.username ASC
  `).all();
  res.json({ totalUsers: count.count, users });
});

app.post('/api/logout', authenticate, (req: any, res: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ success: true });
});

app.get('/api/projects', authenticate, (req: any, res: any) => {
  if (req.username === 'wiron') {
    const projects = db.prepare(`
      SELECT p.id, p.name, u.username 
      FROM projects p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.rowid ASC
    `).all();
    res.json(projects);
  } else {
    const projects = db.prepare('SELECT id, name FROM projects WHERE user_id = ? ORDER BY rowid ASC').all(req.userId);
    res.json(projects);
  }
});

app.post('/api/projects', authenticate, (req: any, res: any) => {
  const { name } = req.body;
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)').run(id, req.userId, name);
  db.prepare('INSERT INTO project_state (project_id, tasks, connections) VALUES (?, ?, ?)').run(id, '[]', '[]');
  res.json({ id, name });
});

app.put('/api/projects/:id', authenticate, (req: any, res: any) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  let result;
  if (req.username === 'wiron') {
    result = db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, req.params.id);
  } else {
    result = db.prepare('UPDATE projects SET name = ? WHERE id = ? AND user_id = ?').run(name, req.params.id, req.userId);
  }
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.delete('/api/projects/:id', authenticate, (req: any, res: any) => {
  let result;
  if (req.username === 'wiron') {
    result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  } else {
    result = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  }
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.get('/api/projects/:id/state', authenticate, (req: any, res: any) => {
  let proj;
  if (req.username === 'wiron') {
    proj = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  } else {
    proj = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  }
  if (!proj) return res.status(404).json({error: 'Not found'});
  const state = db.prepare('SELECT tasks, connections FROM project_state WHERE project_id = ?').get(req.params.id) as any;
  if (state) {
    res.json({ tasks: JSON.parse(state.tasks), connections: JSON.parse(state.connections) });
  } else {
    res.json({ tasks: [], connections: [] });
  }
});

app.post('/api/projects/:id/state', authenticate, (req: any, res: any) => {
  let proj;
  if (req.username === 'wiron') {
    proj = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  } else {
    proj = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  }
  if (!proj) return res.status(404).json({error: 'Not found'});
  const { tasks, connections } = req.body;
  db.prepare(`
    INSERT INTO project_state (project_id, tasks, connections) 
    VALUES (?, ?, ?) 
    ON CONFLICT(project_id) DO UPDATE SET tasks = excluded.tasks, connections = excluded.connections
  `).run(req.params.id, JSON.stringify(tasks), JSON.stringify(connections));
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
  });
}

startServer();
