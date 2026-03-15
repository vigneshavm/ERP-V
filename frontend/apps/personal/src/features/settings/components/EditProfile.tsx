"use client";

import React, { useState } from 'react';
import { Camera, Check, X, User, ChevronLeft } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';

const EditProfile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, setUserProfile, accentColor } = useSettings();
    const [name, setName] = useState(userProfile.name);
    // Allow maximum 2 letters for initials
    const [initials, setInitials] = useState(userProfile.initials);

    const handleSave = () => {
        if (!name.trim()) return;

        let safeInitials = initials.trim().toUpperCase().substring(0, 2);
        // Auto-generate initials if left empty
        if (!safeInitials) {
            const parts = name.trim().split(' ');
            if (parts.length >= 2) {
                safeInitials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            } else {
                safeInitials = name.trim().substring(0, 2).toUpperCase();
            }
        }

        setUserProfile({ name: name.trim(), initials: safeInitials });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--bg-color)',
            zIndex: 4000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'var(--surface-overlay)',
                borderBottom: '1px solid var(--surface-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Edit Profile</h2>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {/* Avatar Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: `linear-gradient(45deg, ${accentColor}, #27AE60)`,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '44px', fontWeight: 800, color: 'var(--bg-color)',
                            border: '4px solid var(--surface-border)',
                            position: 'relative',
                            boxShadow: `0 12px 30px ${accentColor}30`
                        }}>
                            {initials.toUpperCase() || name.substring(0, 2).toUpperCase()}
                            <div style={{
                                position: 'absolute', bottom: '0px', right: '0px',
                                background: 'var(--bg-color)', borderRadius: '50%', padding: '8px',
                                border: '2px solid var(--surface-border)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}>
                                <Camera size={18} color="white" />
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Display Name</label>
                            <div style={{
                                background: 'var(--surface-overlay)',
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                border: '1px solid var(--surface-border)'
                            }}>
                                <User size={20} color="var(--text-secondary)" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none' }}
                                    maxLength={30}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Avatar Initials (Max 2)</label>
                            <div style={{
                                background: 'var(--surface-overlay)',
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                border: '1px solid var(--surface-border)'
                            }}>
                                <input
                                    type="text"
                                    value={initials}
                                    onChange={(e) => setInitials(e.target.value)}
                                    placeholder="e.g. JD"
                                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none', textTransform: 'uppercase' }}
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '48px', display: 'flex', gap: '12px' }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim()}
                            style={{
                                flex: 1, padding: '16px', borderRadius: '16px',
                                background: name.trim() ? accentColor : 'var(--surface-overlay-strong)',
                                border: 'none', color: 'var(--bg-color)', fontSize: '15px', fontWeight: 800,
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                opacity: name.trim() ? 1 : 0.5,
                                cursor: name.trim() ? 'pointer' : 'not-allowed'
                            }}
                        >
                            <Check size={18} />
                            Save Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
