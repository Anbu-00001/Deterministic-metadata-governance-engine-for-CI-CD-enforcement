'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B0F14] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center mb-6">
             <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-[#8A949E] text-sm max-w-md mb-8">
            The governance engine encountered an unexpected runtime exception. Your last analysis results are safe in local storage.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Application
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 p-4 bg-black/40 border border-white/5 rounded-lg text-left max-w-2xl overflow-auto">
               <code className="text-[11px] text-[#EF4444]">{this.state.error?.toString()}</code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
