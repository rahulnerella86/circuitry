import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import InputForm from './components/InputForm';
import CircuitDiagram from './components/CircuitDiagram';
import ComponentList from './components/ComponentList';
import CodeViewer from './components/CodeViewer';
import NetlistViewer from './components/NetlistViewer';
import ExplanationPanel from './components/ExplanationPanel';
import ProjectManager from './components/ProjectManager';
import useCircuitGenerator from './hooks/useCircuitGenerator';

import PowerAnalysis from './components/PowerAnalysis';
import PCBGuide from './components/PCBGuide';
import BOMExport from './components/BOMExport';
import Instructions from './components/Instructions';

export default function App() {
  const circuit = useCircuitGenerator();
  const [showProjects, setShowProjects] = useState(false);

  // Build tabs based on Blueprint.am style
  const tabs = [
    { id: 'info', label: 'Info', icon: '☰' },
    { id: 'diagram', label: 'Diagram', icon: '⬡' },
    { id: 'components', label: 'Parts', icon: '◫' },
    { id: 'code', label: (circuit.config?.domain === 'boolean_logic' || circuit.result?.platform === 'logic') ? 'Truth Table' : 'Code', icon: '⟨/⟩' },
    { id: 'instructions', label: 'Instructions', icon: '☰' },
    { id: 'netlist', label: 'Netlist', icon: '⊞' },
    { id: 'power', label: 'Power', icon: '⚡' },
    { id: 'pcb', label: 'PCB', icon: '▦' },
    { id: 'bom', label: 'BOM', icon: '☷' },
  ];

  return (
    <div className="flex flex-col bg-white text-ink min-h-screen">
      <LandingPage />
      <div id="main-app" className="min-h-screen flex flex-col">
        <Header
          onShowProjects={() => setShowProjects(true)}
          onReset={circuit.reset}
          hasResult={!!circuit.result}
        />

        <main className="flex-1 flex flex-col lg:flex-row gap-0">
          {/* LEFT PANEL — Input Configuration */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] lg:min-h-[calc(100vh-56px)] border-r border-ink-200 bg-white overflow-y-auto">
            <InputForm
              config={circuit.config}
              updateConfig={circuit.updateConfig}
              toggleArrayItem={circuit.toggleArrayItem}
              onGenerate={circuit.generate}
              loading={circuit.loading}
              isValid={circuit.isValid}
              error={circuit.error}
            />
          </aside>

          {/* CENTER + RIGHT — Output */}
          <section className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
            {circuit.result ? (
              <>
                {/* Tab Bar — Blueprint.am style */}
                <div className="flex items-center gap-0 px-4 pt-0 pb-0 border-b border-ink-200 bg-white overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onClick={() => circuit.setActiveTab(tab.id)}
                      className={`tab-button whitespace-nowrap flex items-center gap-1.5 ${
                        circuit.activeTab === tab.id ? 'active' : ''
                      }`}
                    >
                      <span className="opacity-60">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}

                  {/* Validation badge */}
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0 py-2">
                    {circuit.result.validation?.valid !== undefined && (
                      circuit.result.validation.valid ? (
                        <span className="badge-success">✓ Valid</span>
                      ) : (
                        <span className="badge-error">✗ Issues</span>
                      )
                    )}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in bg-white">
                  {circuit.activeTab === 'info' && (
                    <ExplanationPanel
                      explanation={circuit.result.explanation}
                      validation={circuit.result.validation}
                    />
                  )}
                  {circuit.activeTab === 'diagram' && (
                    <CircuitDiagram result={circuit.result} />
                  )}
                  {circuit.activeTab === 'components' && (
                    <ComponentList result={circuit.result} />
                  )}
                  {circuit.activeTab === 'code' && (
                    <CodeViewer
                      code={circuit.result.code}
                      platform={circuit.result.platform}
                    />
                  )}
                  {circuit.activeTab === 'instructions' && (
                    <Instructions result={circuit.result} />
                  )}
                  {circuit.activeTab === 'netlist' && (
                    <NetlistViewer netlist={circuit.result.netlist} />
                  )}
                  {circuit.activeTab === 'power' && (
                    <PowerAnalysis result={circuit.result} />
                  )}
                  {circuit.activeTab === 'pcb' && (
                    <PCBGuide result={circuit.result} />
                  )}
                  {circuit.activeTab === 'bom' && (
                    <BOMExport result={circuit.result} />
                  )}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-8 bg-ink-50">
                <div className="text-center max-w-md animate-fade-in">
                  <div className="w-20 h-20 mx-auto mb-6 border-2 border-ink-200 flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-400">
                      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
                    </svg>
                  </div>
                  <h2 className="font-mono text-2xl font-bold uppercase tracking-tight mb-3">
                    Design Your Circuit
                  </h2>
                  <p className="text-ink-500 leading-relaxed mb-6">
                    Select a domain, choose components, and generate a complete circuit with wiring diagrams, parts list, and build instructions.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Deterministic', 'No API Required', 'Ready-to-Upload'].map(tag => (
                      <span key={tag} className="px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider border border-ink-200 text-ink-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Project Manager Modal */}
        {showProjects && (
          <ProjectManager
            onClose={() => setShowProjects(false)}
            onLoad={(project) => {
              circuit.loadFromProject(project);
              setShowProjects(false);
            }}
            currentConfig={circuit.config}
            currentResult={circuit.result}
          />
        )}
      </div>
    </div>
  );
}
