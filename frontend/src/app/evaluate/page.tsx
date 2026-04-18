'use client';

import React, { useState } from 'react';
import { evaluateSentinel } from '@/lib/api';
import VerdictBanner from '@/components/VerdictBanner';
import ScoreBar from '@/components/ScoreBar';
import BlastChart from '@/components/BlastChart';
import SkillTable from '@/components/SkillTable';
import { Loader2, Play } from 'lucide-react';

export default function EvaluatePage() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      setError('Please provide JSON input data');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      setError('Invalid JSON format. Please ensure your payload is valid.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Assuming array of results is returned if it evaluates multiple entities,
      // or a single result object.
      const res = await evaluateSentinel(parsed);
      // Backend might wrap in "data" or return directly. Check shape here:
      if (Array.isArray(res)) {
        setResult(res[0]); // Simple version: display first entity if array
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'API request failed.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight">Evaluate Sentinel</h1>
        <p className="text-gray-400 mt-2">Run the governance engine against metadata payload changes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Input */}
        <div className="space-y-4 flex flex-col">
          <div className="flex justify-between items-end">
            <label className="block text-sm font-medium text-gray-300">Input Payload (JSON)</label>
            <div className="relative">
              <input 
                type="file" 
                accept=".json" 
                id="file-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer text-xs bg-[#21262d] border border-gray-700 hover:bg-[#30363d] px-3 py-1.5 rounded transition-colors"
              >
                Upload JSON File
              </label>
            </div>
          </div>
          <textarea
            className="w-full h-[400px] bg-[#0d1117] border border-gray-800 rounded-md p-4 font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            placeholder="Paste your JSON input payload here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !jsonInput.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {loading ? 'Evaluating...' : 'Run Sentinel'}
          </button>
          {error && <div className="text-red-400 text-sm p-3 bg-red-950/20 border border-red-900/50 rounded">{error}</div>}
        </div>

        {/* Right Col: Output */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight border-b border-gray-800 pb-2">Results</h2>
          
          {!result && !loading && (
            <div className="h-48 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              Run evaluation to see results here.
            </div>
          )}

          {loading && (
            <div className="h-48 border border-gray-800 bg-[#161b22] rounded-lg flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-500" />
              Computing compliance score...
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <VerdictBanner 
                status={result.fgs?.is_blocked ? 'BLOCKED' : 'PASSED'} 
                explanation={result.fgs?.explanation} 
              />
              
              <div className="bg-[#161b22] border border-gray-800 rounded-lg p-5 space-y-5">
                <ScoreBar 
                  score={result.fgs?.score || 0} 
                  label="Forge Governance Score (FGS)" 
                />
                
                {result.fgs?.compliance_score !== undefined && (
                  <ScoreBar 
                    score={result.fgs?.compliance_score || 0} 
                    label="Compliance Baseline" 
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BlastChart radius={result.fgs?.blast_radius || 0} />
                
                {result.change_magnitude && (
                  <div className="w-full bg-[#161b22] border border-gray-800 rounded-lg p-4 flex flex-col justify-center">
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Change Magnitude</h4>
                    <p className="text-3xl font-light text-white">{result.change_magnitude?.magnitude?.toFixed(4) || 0}</p>
                    <p className="text-xs text-gray-500 mt-2">{result.change_magnitude?.summary}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-300">Skill Executions</h3>
                <SkillTable skills={result.skills_findings || []} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
