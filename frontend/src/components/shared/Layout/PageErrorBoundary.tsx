import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PageErrorBoundaryProps {
    /** Changing this (e.g. the route path) clears the error, so navigating away recovers. */
    resetKey: string;
    children: React.ReactNode;
}

interface PageErrorBoundaryState {
    error: Error | null;
    resetKey: string;
}

/**
 * Contains a crash in one page to that page. Without it, any render error unmounted the whole app
 * (sidebar included) and left a blank screen. Error boundaries have to be class components.
 */
class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
    state: PageErrorBoundaryState = { error: null, resetKey: this.props.resetKey };

    static getDerivedStateFromError(error: Error): Partial<PageErrorBoundaryState> {
        return { error };
    }

    static getDerivedStateFromProps(props: PageErrorBoundaryProps, state: PageErrorBoundaryState): Partial<PageErrorBoundaryState> | null {
        return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Page crashed:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div role="alert" className="flex flex-col items-center justify-center gap-4 min-h-[50vh] p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-error" />
                <h2 className="text-lg font-black text-main">This page couldn't be displayed</h2>
                <p className="text-sm text-slate-500 max-w-md">
                    Something went wrong while showing it. The rest of the app still works; try again, or open another page.
                </p>
                <button
                    onClick={() => this.setState({ error: null })}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
                >
                    Try again
                </button>
            </div>
        );
    }
}

export default PageErrorBoundary;
