import { useState, useCallback, useEffect } from 'react';
import * as api from '../utils/api';

export default function useCircuitGenerator() {
  const [config, setConfig] = useState({
    domain: 'microcontroller',
    platform: '',
    circuitType: '',
    sensors: [],
    actuators: [],
    displays: [],
    communication: [],
    discretes: [],
    power: [],
    features: [],
    // Domain-specific
    equation: '',
    filterType: 'low_pass',
    topology: 'voltage_divider',
    frequency: '1000',
    // NLM specific
    query: '',
    constraints: {},
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('diagram');

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const toggleArrayItem = useCallback((key, item) => {
    setConfig(prev => {
      const arr = prev[key] || [];
      const exists = arr.includes(item);
      return {
        ...prev,
        [key]: exists ? arr.filter(i => i !== item) : [...arr, item],
      };
    });
    setError(null);
  }, []);

  // ── Rule-based generation (existing) ──
  const generate = useCallback(async (configOverride = null) => {
    setLoading(true);
    setError(null);
    try {
      const requestConfig = configOverride || config;
      const data = await api.generateCircuit(requestConfig);
      setResult({ ...data, source: 'rule_engine', mode: 'rule' });
      // NLM results lead with the AI explanation; other domains lead with the diagram
      setActiveTab(data.domain === 'nlm' ? 'info' : 'diagram');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [config]);

  const reset = useCallback(() => {
    setConfig({
      domain: 'microcontroller',
      platform: '',
      circuitType: '',
      sensors: [],
      actuators: [],
      displays: [],
      communication: [],
      discretes: [],
      power: [],
      features: [],
      equation: '',
      filterType: 'low_pass',
      topology: 'voltage_divider',
      frequency: '1000',
      query: '',
      constraints: {},
    });
    setResult(null);
    setError(null);
  }, []);

  const loadFromProject = useCallback((project) => {
    if (project.config) setConfig(project.config);
    if (project.result) {
      setResult(project.result);
      setActiveTab('diagram');
    }
  }, []);

  const isValid = (() => {
    if (config.domain === 'microcontroller') {
      return config.platform &&
        (config.sensors.length > 0 || config.actuators.length > 0 ||
         config.displays?.length > 0 || config.communication?.length > 0 ||
         config.discretes?.length > 0 || config.power?.length > 0);
    } else if (config.domain === 'boolean_logic') {
      if (config.logicMode === 'predefined') return !!config.logicTopology;
      return config.equation && config.equation.trim().length > 0;
    } else if (config.domain === 'analog_filter' || config.domain === 'digital_filter') {
      return config.filterType && config.frequency && !isNaN(Number(config.frequency));
    } else if (config.domain === 'electric') {
      return !!config.topology;
    } else if (config.domain === 'passive') {
      return !!config.passiveType;
    } else if (config.domain === 'analog') {
      return !!config.analogType;
    } else if (config.domain === 'power') {
      return !!config.powerType;
    } else if (config.domain === 'protection') {
      return !!config.protectionType;
    } else if (config.domain === 'communication') {
      return !!config.commType;
    } else if (config.domain === 'timing') {
      return !!config.timingType;
    } else if (config.domain === 'nlm') {
      return config.query && config.query.trim().length > 10;
    }
    return false;
  })();

  return {
    config,
    result,
    loading,
    error,
    activeTab,
    setActiveTab,
    updateConfig,
    toggleArrayItem,
    generate,
    reset,
    loadFromProject,
    isValid,
  };
}
