import React from 'react';
import type { ReportType } from './config/reportViews';
import { reportPageFor } from './config/reportPages';
import { ReportComingSoon } from './components';

/**
 * Routes a report view to its page. Every page is a ReportPageShell over a report API; there is no sample-data path.
 */
const BusinessReportsHub: React.FC<{ view: ReportType }> = ({ view }) => {
    // reportPageFor reads a static map, so the component identity is stable per view.
    const page = reportPageFor(view);
    return page ? React.createElement(page) : <ReportComingSoon title="This report" />;
};

export default BusinessReportsHub;
