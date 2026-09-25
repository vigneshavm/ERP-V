export interface ColorClasses {
    surface: string;
    icon: string;
    text: string;
    selected: string;
}

const colorClasses: Record<string, ColorClasses> = {
    primary: {
        surface: 'bg-primary/10',
        icon: 'text-primary',
        text: 'text-primary',
        selected: 'bg-primary/10 border-primary/20 text-primary'
    },
    success: {
        surface: 'bg-success/10',
        icon: 'text-success',
        text: 'text-success',
        selected: 'bg-success/10 border-success/20 text-success'
    },
    danger: {
        surface: 'bg-danger/10',
        icon: 'text-danger',
        text: 'text-danger',
        selected: 'bg-danger/10 border-danger/20 text-danger'
    },
    warning: {
        surface: 'bg-warning/10',
        icon: 'text-warning',
        text: 'text-warning',
        selected: 'bg-warning/10 border-warning/20 text-warning'
    },
    info: {
        surface: 'bg-info/10',
        icon: 'text-info',
        text: 'text-info',
        selected: 'bg-info/10 border-info/20 text-info'
    },
    amber: {
        surface: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-600',
        selected: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600'
    },
    blue: {
        surface: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-600',
        selected: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600'
    },
    cyan: {
        surface: 'bg-cyan-50 dark:bg-cyan-900/20',
        icon: 'text-cyan-600 dark:text-cyan-400',
        text: 'text-cyan-600',
        selected: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600'
    },
    emerald: {
        surface: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-600',
        selected: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600'
    },
    indigo: {
        surface: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-600',
        selected: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600'
    },
    lime: {
        surface: 'bg-lime-50 dark:bg-lime-900/20',
        icon: 'text-lime-600 dark:text-lime-400',
        text: 'text-lime-600',
        selected: 'bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800 text-lime-600'
    },
    orange: {
        surface: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-600',
        selected: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600'
    },
    pink: {
        surface: 'bg-pink-50 dark:bg-pink-900/20',
        icon: 'text-pink-600 dark:text-pink-400',
        text: 'text-pink-600',
        selected: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-600'
    },
    purple: {
        surface: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-600',
        selected: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600'
    },
    rose: {
        surface: 'bg-rose-50 dark:bg-rose-900/20',
        icon: 'text-rose-600 dark:text-rose-400',
        text: 'text-rose-600',
        selected: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600'
    },
    slate: {
        surface: 'bg-slate-50 dark:bg-slate-900/20',
        icon: 'text-slate-600 dark:text-slate-400',
        text: 'text-slate-600',
        selected: 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 text-slate-600'
    },
    violet: {
        surface: 'bg-violet-50 dark:bg-violet-900/20',
        icon: 'text-violet-600 dark:text-violet-400',
        text: 'text-violet-600',
        selected: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600'
    }
};

export const getColorClasses = (color: string): ColorClasses => colorClasses[color] || colorClasses.slate;

export const textAlignmentClasses: Record<'left' | 'right' | 'center', string> = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center'
};
