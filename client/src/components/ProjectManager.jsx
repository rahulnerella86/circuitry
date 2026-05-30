import { useState, useEffect } from 'react';
import * as api from '../utils/api';

export default function ProjectManager({ onClose, onLoad, currentConfig, currentResult }) {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('load'); // 'load' | 'save'

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.loadProjects();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!projectName.trim() || !currentResult) return;
    setSaving(true);
    try {
      await api.saveProject({
        name: projectName.trim(),
        config: currentConfig,
        result: currentResult,
      });
      setProjectName('');
      await loadProjects();
      setTab('load');
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  const handleLoad = async (projectId) => {
    try {
      const project = await api.loadProject(projectId);
      onLoad(project);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await api.deleteProject(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const hasSavableProject = !!currentResult;
  const componentCount =
    (currentConfig?.sensors?.length || 0) +
    (currentConfig?.actuators?.length || 0) +
    (currentConfig?.displays?.length || 0) +
    (currentConfig?.communication?.length || 0) +
    (currentConfig?.discretes?.length || 0) +
    (currentConfig?.power?.length || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl glass-card rounded-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-700">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Projects
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink hover:bg-white/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-200">
          <button
            onClick={() => setTab('load')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
              tab === 'load'
                ? 'text-ink border-b-2 border-primary-400 bg-ink-50/[0.02]'
                : 'text-ink-400 hover:text-ink-400'
            }`}
          >
            Load Project
          </button>
          <button
            onClick={() => setTab('save')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
              tab === 'save'
                ? 'text-ink border-b-2 border-primary-400 bg-ink-50/[0.02]'
                : 'text-ink-400 hover:text-ink-400'
            }`}
          >
            Save Current
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[400px] overflow-y-auto">
          {tab === 'load' ? (
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">📂</div>
                  <p className="text-ink-400 text-sm">No saved projects yet</p>
                  <p className="text-ink-500 text-xs mt-1">Generate a circuit and save it here</p>
                </div>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-ink-50/[0.02] border border-ink-200 hover:border-primary-500/20 hover:bg-ink-50/[0.04] transition-all group"
                  >
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoad(project.id)}>
                      <div className="font-medium text-ink text-sm truncate">{project.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {project.platform && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/10 text-ink-700 font-medium">
                            {project.platform}
                          </span>
                        )}
                        <span className="text-[10px] text-ink-500">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      className="p-1.5 rounded-lg text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!hasSavableProject ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">⚙️</div>
                  <p className="text-ink-400 text-sm">No circuit to save</p>
                  <p className="text-ink-500 text-xs mt-1">Configure and generate a circuit first</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-ink-500 mb-1.5 block">Project Name</label>
                    <input
                      id="input-project-name"
                      type="text"
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      placeholder="My Circuit Project"
                      className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-white/10 text-ink placeholder-surface-600 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all text-sm"
                      onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                  </div>

                  {/* Config preview */}
                  <div className="p-3 rounded-xl bg-ink-50/[0.02] border border-ink-200 text-xs space-y-1">
                    <div className="flex justify-between text-ink-500">
                      <span>Domain</span>
                      <span className="text-ink">{currentConfig?.domain?.replace(/_/g, ' ') || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <span>Components</span>
                      <span className="text-ink">{componentCount}</span>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <span>Has Result</span>
                      <span className={currentResult ? 'text-green-400' : 'text-ink-500'}>{currentResult ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <button
                    id="btn-save-project"
                    onClick={handleSave}
                    disabled={!projectName.trim() || saving}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><div className="spinner w-4 h-4 border-2"></div> Saving...</>
                    ) : (
                      '💾 Save Project'
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
