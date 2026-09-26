import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { } from 'react-router-dom';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchSalaryComponents, fetchSalaryStructure, saveSalaryStructure, createSalaryComponent, bulkUpdateSalaryStructure } from '../../redux/slices/payrollSlice';
import { Plus, Save, User, Users } from 'lucide-react';
import api from '../../services/api';

// Component id -> amount for a saved salary structure (empty when there is none yet).
const toStructureValues = (struct?: { components: any[] }): Record<string, number> => {
    const values: Record<string, number> = {};
    struct?.components.forEach((c: any) => {
        const cId = typeof c.componentId === 'string' ? c.componentId : c.componentId._id;
        values[cId] = c.amount;
    });
    return values;
};

const SalaryStructureManager = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { components, structures, loading } = useSelector((state: RootState) => state.payroll);

    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [structureValues, setStructureValues] = useState<Record<string, number>>({});

    // Config Mode
    const [isConfigMode, setIsConfigMode] = useState(false);
    const [newComponent, setNewComponent] = useState({ name: '', type: 'EARNING', calculationType: 'FLAT', defaultValue: 0, isTaxable: true });

    useEffect(() => {
        dispatch(fetchSalaryComponents());
        // Load employees
        const loadEmployees = async () => {
            try {
                const res = await api.get('/api/employees');
                if (res.data.success) setEmployees(res.data.data);
            } catch {
                console.error("Failed to load employees");
            }
        };
        loadEmployees();
    }, [dispatch]);

    useEffect(() => {
        if (selectedEmployeeId) {
            dispatch(fetchSalaryStructure(selectedEmployeeId));
        }
    }, [selectedEmployeeId, dispatch]);

    // Load the selected employee's saved structure into the editable values when the employee or
    // their saved structure changes; adjusted during render (tracking the previous inputs) instead
    // of setState in an effect.
    const savedStructure = selectedEmployeeId ? structures[selectedEmployeeId] : undefined;
    const [loadedFrom, setLoadedFrom] = useState({ selectedEmployeeId, savedStructure });
    if (loadedFrom.selectedEmployeeId !== selectedEmployeeId || loadedFrom.savedStructure !== savedStructure) {
        setLoadedFrom({ selectedEmployeeId, savedStructure });
        setStructureValues(toStructureValues(savedStructure));
    }

    const handleSave = () => {
        if (!selectedEmployeeId) return;

        const payloadComponents = Object.entries(structureValues).map(([cId, amount]) => ({
            componentId: cId,
            amount: Number(amount)
        }));

        dispatch(saveSalaryStructure({
            employeeId: selectedEmployeeId,
            components: payloadComponents,
            effectiveFrom: new Date().toISOString()
        }));
    };

    const handleCreateComponent = async () => {
        await dispatch(createSalaryComponent(newComponent as any));
        setIsConfigMode(false);
        setNewComponent({ name: '', type: 'EARNING', calculationType: 'FLAT', defaultValue: 0, isTaxable: true });
    };

    const calculateGross = () => {
        let gross = 0;
        const selectedEmp = employees.find(e => e._id === selectedEmployeeId);
        const basic = selectedEmp?.baseSalary || 0;

        components.filter(c => c.type === 'EARNING').forEach(c => {
            const value = (structureValues[c._id] || 0);
            if (c.calculationType === 'PERCENTAGE') {
                gross += (basic * value) / 100;
            } else {
                gross += value;
            }
        });
        return gross + basic; // Add basic to gross
    };

    // Bulk Update State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkData, setBulkData] = useState({ componentId: '', amount: 0, confirm: false });

    const handleBulkUpdate = async () => {
        if (!bulkData.componentId || !bulkData.amount || !bulkData.confirm) {
            alert("Please select a component, enter amount, and confirm.");
            return;
        }
        // Dispatch bulk update action (Make sure to import it)
        await dispatch(bulkUpdateSalaryStructure({
            componentId: bulkData.componentId,
            amount: bulkData.amount
        }));

        setIsBulkMode(false);
        setBulkData({ componentId: '', amount: 0, confirm: false });
        alert("Bulk update initiated successfully.");
    };

    return (
        <Layout>
            {isBulkMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Bulk Assign Component</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Component</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={bulkData.componentId}
                                onChange={e => setBulkData({ ...bulkData, componentId: e.target.value })}
                            >
                                <option value="">Select Component</option>
                                {components.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Amount / Rate</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                value={bulkData.amount}
                                onChange={e => setBulkData({ ...bulkData, amount: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="mb-6 flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="confirmBulk"
                                className="mt-1"
                                checked={bulkData.confirm}
                                onChange={e => setBulkData({ ...bulkData, confirm: e.target.checked })}
                            />
                            <label htmlFor="confirmBulk" className="text-xs text-gray-600">
                                I confirm that I want to update/add this component for <strong>ALL active employees</strong>. This cannot be undone easily.
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsBulkMode(false)}
                                className="px-3 py-1 text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpdate}
                                disabled={!bulkData.confirm}
                                className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
                            >
                                Apply to All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-8">
                <PageHeader
                    title="Salary Structure Configuration"
                    description="Define earnings and deductions for employees."
                    breadcrumbs={[
                        { label: 'Payroll', link: '/people/payroll' },
                        { label: 'Structure' }
                    ]}
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={() => dispatch(fetchSalaryComponents())}
                                className="px-3 py-2 text-primary hover:bg-primary-soft rounded-lg text-sm font-medium border border-transparent hover:border-primary/30"
                                title="Refresh Components"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={() => setIsBulkMode(true)}
                                className="px-4 py-2 bg-primary-soft border border-primary/30 text-primary rounded-lg hover:bg-primary-soft text-sm font-medium flex items-center gap-2"
                            >
                                <Users size={16} /> Bulk Assign
                            </button>
                            <button
                                onClick={() => setIsConfigMode(!isConfigMode)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                {isConfigMode ? 'Done Configuring' : 'Manage Components'}
                            </button>
                        </div>
                    }
                />

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar / Employee Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-primary"
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        >
                            <option value="">-- Select Employee --</option>
                            {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.role})</option>)}
                        </select>

                        {selectedEmployeeId && (
                            <div className="p-4 bg-primary-soft rounded-lg border border-primary/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-primary-soft rounded-full flex items-center justify-center text-primary">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{employees.find(e => e._id === selectedEmployeeId)?.name}</p>
                                        <p className="text-xs text-gray-500">{employees.find(e => e._id === selectedEmployeeId)?.role}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-primary/30">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-600">Estimated Gross</span>
                                        <span className="font-bold text-gray-900">₹{calculateGross().toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Components</span>
                                        <span className="font-medium">{Object.keys(structureValues).length}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Structure Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {isConfigMode ? (
                            <div className="bg-white rounded-xl shadow-sm border border-warning-line p-6 animate-in fade-in">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-warning" />
                                    Add New Salary Component
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                                        <input
                                            value={newComponent.name} onChange={e => setNewComponent({ ...newComponent, name: e.target.value })}
                                            className="w-full mt-1 p-2 border rounded" placeholder="e.g. Basic, HRA"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                                        <select
                                            value={newComponent.type} onChange={e => setNewComponent({ ...newComponent, type: e.target.value as any })}
                                            className="w-full mt-1 p-2 border rounded"
                                        >
                                            <option value="EARNING">Earning</option>
                                            <option value="DEDUCTION">Deduction</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase">Default Value</label>
                                        <input
                                            type="number"
                                            value={newComponent.defaultValue} onChange={e => setNewComponent({ ...newComponent, defaultValue: parseFloat(e.target.value) })}
                                            className="w-full mt-1 p-2 border rounded"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleCreateComponent}
                                    className="mt-4 w-full py-2 bg-warning text-white rounded hover:bg-warning/90 font-medium"
                                >
                                    Create Component
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                {selectedEmployeeId ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Salary Breakdown</h3>

                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Earnings</h4>
                                                <div className="space-y-3">
                                                    {components.filter(c => c.type === 'EARNING').map(c => (
                                                        <div key={c._id} className="flex items-center gap-4">
                                                            <div className="w-1/3 text-sm font-medium text-gray-700">
                                                                {c.name} {c.calculationType === 'PERCENTAGE' && <span className="text-[10px] text-primary">(%)</span>}
                                                            </div>
                                                            <div className="flex-1 relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                                    {c.calculationType === 'PERCENTAGE' ? '%' : '₹'}
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    value={structureValues[c._id] || ''}
                                                                    onChange={(e) => setStructureValues({ ...structureValues, [c._id]: parseFloat(e.target.value) })}
                                                                    placeholder={c.defaultValue.toString()}
                                                                    className="w-full pl-8 py-2 border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-primary transition-all font-mono text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-dashed border-gray-200">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deductions</h4>
                                                <div className="space-y-3">
                                                    {components.filter(c => c.type === 'DEDUCTION').map(c => (
                                                        <div key={c._id} className="flex items-center gap-4">
                                                            <div className="w-1/3 text-sm font-medium text-gray-700">
                                                                {c.name} {c.calculationType === 'PERCENTAGE' && <span className="text-[10px] text-danger">(%)</span>}
                                                            </div>
                                                            <div className="flex-1 relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                                    {c.calculationType === 'PERCENTAGE' ? '%' : '₹'}
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    value={structureValues[c._id] || ''}
                                                                    onChange={(e) => setStructureValues({ ...structureValues, [c._id]: parseFloat(e.target.value) })}
                                                                    placeholder={c.defaultValue.toString()}
                                                                    className="w-full pl-8 py-2 border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-primary transition-all font-mono text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                                            <button
                                                onClick={() => setSelectedEmployeeId('')}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 shadow-sm"
                                            >
                                                <Save size={18} />
                                                {loading ? 'Saving...' : 'Save Structure'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        <Users className="w-12 h-12 mb-3 text-gray-200" />
                                        <p>Select an employee to configure their salary structure.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalaryStructureManager;
