import React from 'react';
import { Check, X } from 'lucide-react';

interface SkillFinding {
  skill: string;
  result: {
    passed?: boolean;
    score?: number;
    violations?: any[];
    error?: string;
    [key: string]: any;
  };
}

interface SkillTableProps {
  skills: SkillFinding[];
}

export default function SkillTable({ skills }: SkillTableProps) {
  if (!skills || skills.length === 0) {
    return <div className="text-sm text-gray-500 py-4 border-t border-gray-800">No skill findings available.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-800 text-sm w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <th className="py-2 px-4 font-medium">Skill Name</th>
            <th className="py-2 px-4 font-medium w-24">Status</th>
            <th className="py-2 px-4 font-medium w-24">Score</th>
            <th className="py-2 px-4 font-medium text-right">Violations / Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-[#0d1117]">
          {skills.map((skill, idx) => {
            const hasError = !!skill.result?.error;
            const isPassed = skill.result?.passed !== false && !hasError;
            const validations = skill.result?.violations?.length || 0;
            const score = skill.result?.score !== undefined ? skill.result.score : 'N/A';
            
            return (
              <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-4 font-mono text-gray-300">{skill.skill}</td>
                <td className="py-3 px-4">
                  {isPassed ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-950/50 text-green-400 border border-green-900">
                      <Check className="w-3 h-3" /> Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-950/50 text-red-400 border border-red-900">
                      <X className="w-3 h-3" /> {hasError ? 'Error' : 'Fail'}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-400">{typeof score === 'number' ? score.toFixed(2) : score}</td>
                <td className="py-3 px-4 text-right text-gray-400">
                  {hasError ? (
                    <span className="text-red-400 truncate max-w-xs inline-block" title={skill.result.error}>
                      {skill.result.error}
                    </span>
                  ) : validations > 0 ? (
                    <span className="text-yellow-500">{validations} violation(s)</span>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
