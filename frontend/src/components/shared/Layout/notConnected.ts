import React from 'react';
import NotConnectedPage, { type NotConnectedInfo } from './NotConnectedPage';

/** A page component with fixed text, so ModuleRegistry can lazy-load a placeholder like any other page. */
export const notConnected = (info: NotConnectedInfo): React.FC => {
    const Page: React.FC = () => React.createElement(NotConnectedPage, info);
    Page.displayName = `NotConnected(${info.title})`;
    return Page;
};
