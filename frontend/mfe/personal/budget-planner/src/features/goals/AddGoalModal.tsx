"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, Users, Plus, Check, Search, Info } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Goal, Participant } from '@repo/shared';
import { addGoal } from './services/goalsApi';
import { fetchContacts } from '../transactions/services/transactionsApi';
import { useLanguage } from '@repo/shared';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdded: () => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdded }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchContacts().then(setContacts);
        }
    }, [isOpen]);

    const handleToggleContact = (contact: any) => {
        if (selectedContacts.find(c => c.id === contact.id)) {
            setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts([...selectedContacts, contact]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const newGoal: Omit<Goal, 'id'> = {
            name,
            target: parseFloat(target),
            current: 0,
            icon: 'Target', // Default for now
            color: 'var(--primary-color)', // Default for now
            deadline: deadline || 'Dec 2026',
            dailyNudge: Math.round(parseFloat(target) / 365), // Rough estimate
            isCollaborative,
            participants: isCollaborative ? selectedContacts.map(c => ({
                id: c.id,
                name: c.name,
                initials: c.initials,
                color: c.color,
                contribution: 0
            })) : undefined
        };

        try {
            await addGoal(newGoal);
            onAdded();
            onClose();
        } catch (error) {
            console.error("Failed to create goal:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('goals.addNew') || "Create New Goal"}
            maxWidth="500px"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input
                        label={t('goals.goalName') || "Goal Name"}
                        placeholder="e.g. Dream Vacation"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        icon={<Target size={18} />}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Input
                            label={t('goals.targetAmount') || "Target Amount"}
                            placeholder="50000"
                            type="number"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            required
                        />
                        <Input
                            label={t('goals.deadline') || "Deadline"}
                            placeholder="Dec 2026"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            icon={<Calendar size={18} />}
                        />
                    </div>
                </div>

                {/* Collaborative Toggle */}
                <div style={{
                    background: 'var(--surface-overlay)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--surface-border)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollaborative ? '16px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: isCollaborative ? 'rgba(var(--primary-color-rgb), 0.1)' : 'var(--surface-overlay)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: isCollaborative ? 'var(--primary-color)' : 'var(--text-secondary)'
                            }}>
                                <Users size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{t('goals.collaborative') || "Collaborative Goal"}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Invite partners or family</p>
                            </div>
                        </div>
                        <div
                            onClick={() => setIsCollaborative(!isCollaborative)}
                            style={{
                                width: '44px',
                                height: '24px',
                                borderRadius: '12px',
                                background: isCollaborative ? 'var(--primary-color)' : 'var(--surface-overlay-strong)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <motion.div
                                animate={{ x: isCollaborative ? 22 : 2 }}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'var(--bg-color)',
                                    position: 'absolute',
                                    top: '2px'
                                }}
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {isCollaborative && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ borderTop: '1px solid var(--surface-border)', marginTop: '16px', paddingTop: '16px' }}>
                                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="text"
                                            placeholder="Search contacts..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'var(--surface-overlay)',
                                                border: '1px solid var(--surface-border)',
                                                borderRadius: '12px',
                                                padding: '10px 12px 10px 36px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {filteredContacts.map(contact => {
                                            const isSelected = selectedContacts.find(c => c.id === contact.id);
                                            return (
                                                <div
                                                    key={contact.id}
                                                    onClick={() => handleToggleContact(contact)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px',
                                                        borderRadius: '12px',
                                                        background: isSelected ? 'var(--surface-overlay)' : 'transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        border: isSelected ? '1px solid var(--surface-border)' : '1px solid transparent'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: contact.color,
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            color: 'var(--bg-color)'
                                                        }}>
                                                            {contact.initials}
                                                        </div>
                                                        <span style={{ fontSize: '15px' }}>{contact.name}</span>
                                                    </div>
                                                    {isSelected && <Check size={16} color="var(--success-color)" />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedContacts.length > 0 && (
                                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {selectedContacts.map(c => (
                                                <div
                                                    key={c.id}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '13px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: 'var(--surface-overlay)',
                                                        border: '1px solid var(--surface-border)'
                                                    }}
                                                >
                                                    <span>{c.name}</span>
                                                    <X size={12} className="clickable" onClick={(e) => { e.stopPropagation(); handleToggleContact(c); }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        style={{ flex: 1 }}
                    >
                        {t('common.cancel') || "Cancel"}
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={!name || !target || loading || (isCollaborative && selectedContacts.length === 0)}
                        style={{ flex: 1 }}
                    >
                        {loading ? "Creating..." : (t('common.create') || "Create Goal")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddGoalModal;
