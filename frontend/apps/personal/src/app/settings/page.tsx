"use client";

import SettingsView from '@/features/settings/views/SettingsView';
import { useState } from 'react';
import { SecurityPinMode } from '@/features/auth';

export default function SettingsPage() {
    const [, setPinMode] = useState<SecurityPinMode>('ENTER');
    const appPin = typeof window !== 'undefined' ? localStorage.getItem('app-pin') : null;

    return (
        <SettingsView
            setPinMode={setPinMode}
            appPin={appPin}
        />
    );
}
