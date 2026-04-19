'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// ── Types ──

export interface EvaluationResult {
  id: string;
  fgs_score: number;
  blast_radius: number;
  lineage_graph: {
    nodes: any[];
    edges: any[];
  };
  decision: "APPROVE" | "REJECT" | "REVIEW" | "ESCALATE" | "ALLOW" | "WARN" | "BLOCK";
  risk: Record<string, number>;
  suggestions: any[];
  timestamp: string;
  ai_insight?: {
    summary: string;
    risks: string[];
    suggestions: string[];
    explanation_tree?: string[];
  };
  change_magnitude?: number;
  policy_decision?: string;
  policy_triggered?: string[];
  confidence_score?: number;  
  suggestions_out?: { title: string; severity: string; action: string; expected_impact: string }[];
  simulation_out?: { current_fgs: number; projected_fgs: number; delta: number; risk_reduction: string };
  reasoning_chain_out?: string[];
  historical_patterns?: { pattern: string; frequency: number; risk_level: string }[];
  predicted_risk?: { predicted_risk: string; confidence: number; reason: string };
}

interface HephaestusState {
  connection: "idle" | "connected" | "degraded" | "offline";
  loading: boolean;
  error: string | null;
  result: EvaluationResult | null;
  history: EvaluationResult[];
  activeTab: string;
  optimizationLoading: boolean;
  optimizationResult: any;
  timelineLoading: boolean;
  timeline: any[];
  timelineFetched: boolean;
  logsLoading: boolean;
  logs: any[];
  logsFetched: boolean;
}

type Action =
  | { type: 'HEALTH_OK' }
  | { type: 'HEALTH_DEGRADED' }
  | { type: 'HEALTH_OFFLINE' }
  | { type: 'EVALUATE_START' }
  | { type: 'EVALUATE_SUCCESS'; payload: EvaluationResult }
  | { type: 'EVALUATE_FAILURE'; payload: string }
  | { type: 'OPTIMIZE_START' }
  | { type: 'OPTIMIZE_SUCCESS'; payload: any }
  | { type: 'OPTIMIZE_FAILURE'; payload: string }
  | { type: 'TIMELINE_START' }
  | { type: 'TIMELINE_SUCCESS'; payload: any[] }
  | { type: 'TIMELINE_FAILURE'; payload: string }
  | { type: 'LOGS_START' }
  | { type: 'LOGS_SUCCESS'; payload: any[] }
  | { type: 'LOGS_FAILURE'; payload: string }
  | { type: 'SET_TAB'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'HYDRATE_HISTORY'; payload: EvaluationResult[] };

// ── Reducer ──

function reducer(state: HephaestusState, action: Action): HephaestusState {
  switch (action.type) {
    case 'HEALTH_OK': return { ...state, connection: 'connected' };
    case 'HEALTH_DEGRADED': return { ...state, connection: 'degraded' };
    case 'HEALTH_OFFLINE': return { ...state, connection: 'offline' };
    case 'EVALUATE_START': return { ...state, loading: true, error: null };
    case 'EVALUATE_SUCCESS': {
      const newHistory = [action.payload, ...state.history].slice(0, 50);
      localStorage.setItem("hephaestus_history", JSON.stringify(newHistory));
      return { ...state, loading: false, result: action.payload, history: newHistory };
    }
    case 'EVALUATE_FAILURE': return { ...state, loading: false, error: action.payload };
    case 'OPTIMIZE_START': return { ...state, optimizationLoading: true };
    case 'OPTIMIZE_SUCCESS': return { ...state, optimizationLoading: false, optimizationResult: action.payload };
    case 'OPTIMIZE_FAILURE': return { ...state, optimizationLoading: false, error: action.payload };
    case 'TIMELINE_START': return { ...state, timelineLoading: true };
    case 'TIMELINE_SUCCESS': return { ...state, timelineLoading: false, timeline: action.payload, timelineFetched: true };
    case 'TIMELINE_FAILURE': return { ...state, timelineLoading: false, error: action.payload };
    case 'LOGS_START': return { ...state, logsLoading: true };
    case 'LOGS_SUCCESS': return { ...state, logsLoading: false, logs: action.payload, logsFetched: true };
    case 'LOGS_FAILURE': return { ...state, logsLoading: false, error: action.payload };
    case 'SET_TAB': return { ...state, activeTab: action.payload };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'CLEAR_HISTORY': {
      localStorage.removeItem("hephaestus_history");
      return { ...state, history: [] };
    }
    case 'HYDRATE_HISTORY': return { ...state, history: action.payload };
    default: return state;
  }
}

// ── Context ──

const HephaestusContext = createContext<{ state: HephaestusState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const initialState: HephaestusState = {
  connection: "idle",
  loading: false,
  error: null,
  result: null,
  history: [],
  activeTab: "dashboard",
  optimizationLoading: false,
  optimizationResult: null,
  timelineLoading: false,
  timeline: [],
  timelineFetched: false,
  logsLoading: false,
  logs: [],
  logsFetched: false,
};

// ── API Wrapper (Phase 2) ──

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // Phase 2.1 Standardized 30s
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...options.headers }
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      return await res.json();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") throw new Error("Request timed out after 30 seconds");
      throw err;
    }
}

export const api = {
    health: () => request("/api/health"),
    evaluate: (input: any) => request("/api/sentinel/evaluate", {
      method: "POST",
      body: JSON.stringify(input)
    }),
    timeline: () => request("/api/timeline"),
    optimize: (payload: any) => request("/api/optimize", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
    logs: (filters: Record<string, string> = {}) =>
      request("/api/logs?" + new URLSearchParams(filters)),
};

// ── Provider ──

export function HephaestusProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem("hephaestus_history");
    if (saved) {
      try {
        dispatch({ type: 'HYDRATE_HISTORY', payload: JSON.parse(saved) });
      } catch (e) { console.error("History hydration failed", e); }
    }
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.health();
        dispatch({ type: 'HEALTH_OK' });
      } catch (e) {
        dispatch({ type: 'HEALTH_OFFLINE' });
      }
    };
    checkHealth();
    const id = setInterval(checkHealth, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <HephaestusContext.Provider value={{ state, dispatch }}>
      {children}
    </HephaestusContext.Provider>
  );
}

export function useHephaestus() {
  const context = useContext(HephaestusContext);
  if (context === undefined) throw new Error("useHephaestus must be used within a HephaestusProvider");
  return context;
}
