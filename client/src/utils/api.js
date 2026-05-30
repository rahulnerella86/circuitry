const API_BASE = '/api';

export async function generateCircuit(config) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Generation failed');
  }
  return res.json();
}

export async function fetchComponents() {
  const res = await fetch(`${API_BASE}/components`);
  return res.json();
}

export async function fetchPlatforms() {
  const res = await fetch(`${API_BASE}/platforms`);
  return res.json();
}

export async function saveProject(project) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return res.json();
}

export async function loadProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function loadProject(id) {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  return res.json();
}
