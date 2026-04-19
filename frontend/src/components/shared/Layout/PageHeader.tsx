import React from 'react';

interface Breadcrumb {
    label: string;
    link?: string | null;
}

interface PageHeaderProps {
    title: string;
    description?: string | null;
    actions?: React.ReactNode;
    backButton?: React.ReactNode;
    breadcrumbs?: Breadcrumb[] | null;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    actions = null,
    backButton = null,
    breadcrumbs = null
}) => {
    return (
        <div className="mb-10 space-y-6">
            {backButton && (
                <div className="flex">
                    {backButton}
                </div>
            )}

            {breadcrumbs && (
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="flex items-center">
                                {index > 0 && (
                                    <span className="mx-2 text-neutral-600">/</span>
                                )}
                                {crumb.link ? (
                                    <a href={crumb.link} className="hover:text-primary transition-colors">
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className="text-neutral-500">{crumb.label}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-white leading-none">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-3 items-center">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
