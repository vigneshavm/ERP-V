import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/shared/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { RootState, AppDispatch } from '../../../redux/store';
import { fetchAttendanceSummary, saveAttendanceSummary } from '../../../redux/slices/payrollSlice';
import { Save, Calendar, Filter, Download } from 'lucide-react';
import api from '../../../services/api';

const AttendanceSummaryManager = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { attendance, success, loading } = useSelector((state: RootState) => state.payroll);

    const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
    const [employees, setEmployees] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<Record<string, any>>({});

    // Load available employees
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const res = await api.get('/api/hr/employees');
                if (res.data.success) setEmployees(res.data.data);
            } catch (e) {
                console.error("Failed to load employees");
            }
        };
        loadEmployees();
    }, []);

    // Load attendance for month
    useEffect(() => {
        dispatch(fetchAttendanceSummary(selectedDate));
    }, [dispatch, selectedDate]);

    // Merge logic: attendance from DB + remaining employees
    useEffect(() => {
        const initialData: Record<string, any> = {};

        employees.forEach(emp => {
            const existing = attendance.find((a: any) => {
                const aId = typeof a.employeeId === 'string' ? a.employeeId : a.employeeId._id;
                return aId === emp._id;
            });

            if (existing) {
                const aId = typeof existing.employeeId === 'string' ? existing.employeeId : existing.employeeId._id;
                initialData[emp._id] = { ...existing, employeeId: aId, isModified: false };
            } else {
                initialData[emp._id] = {
                    employeeId: emp._id,
                    employeeName: emp.name,
                    month: selectedDate.month,
                    year: selectedDate.year,
                    workedDays: new Date(selectedDate.year, selectedDate.month + 1, 0).getDate(), // Default to full month
                    leavesTaken: 0,
                    overtimeHours: 0,
                    holidays: 0,
                    weeklyOffs: 4, // Approx
                    totalDays: new Date(selectedDate.year, selectedDate.month + 1, 0).getDate(),
                    status: 'NEW'
                };
            }
        });
        setSummaryData(initialData);
    }, [attendance, employees, selectedDate]);

    const handleUpdate = (empId: string, field: string, value: number) => {
        setSummaryData(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [field]: value,
                isModified: true
            }
        }));
    };

    const handleSaveRow = (empId: string) => {
        const data = summaryData[empId];
        dispatch(saveAttendanceSummary({
            ...data,
            employeeId: empId,
            month: selectedDate.month,
            year: selectedDate.year
        }));
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageHeader
                    title="Attendance Summary"
                    description="Review and adjust monthly attendance before generating payroll."
                    breadcrumbs={[
                        { label: 'Payroll', link: '/people/payroll' },
                        { label: 'Attendance' }
                    ]}
                />

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-400" />
                            <select
                                className="p-2 border rounded-lg bg-gray-50 text-sm font-medium"
                                value={selectedDate.month}
                                onChange={(e) => setSelectedDate({ ...selectedDate, month: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="w-24 p-2 border rounded-lg bg-gray-50 text-sm font-medium"
                                value={selectedDate.year}
                                onChange={(e) => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                                    <th className="px-6 py-4 font-medium">Employee</th>
                                    <th className="px-4 py-4 font-medium w-32">Total Days</th>
                                    <th className="px-4 py-4 font-medium w-32">Worked</th>
                                    <th className="px-4 py-4 font-medium w-32">Leaves</th>
                                    <th className="px-4 py-4 font-medium w-32">Overtime (Hrs)</th>
                                    <th className="px-4 py-4 font-medium w-32">Offs/Holidays</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {Object.values(summaryData).map((record: any) => {
                                    const recordEmpId = typeof record.employeeId === 'string' ? record.employeeId : record.employeeId?._id;
                                    const emp = employees.find(e => e._id === recordEmpId);
                                    return (
                                        <tr key={record.employeeId} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {emp?.name}
                                                <span className="block text-xs text-gray-400 font-normal">{emp?.role}</span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500">{record.totalDays}</td>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="number"
                                                    value={record.workedDays}
                                                    onChange={(e) => handleUpdate(record.employeeId, 'workedDays', parseFloat(e.target.value))}
                                                    className="w-full p-2 border border-gray-200 rounded bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="number"
                                                    value={record.leavesTaken}
                                                    onChange={(e) => handleUpdate(record.employeeId, 'leavesTaken', parseFloat(e.target.value))}
                                                    className="w-full p-2 border border-gray-200 rounded bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="number"
                                                    value={record.overtimeHours}
                                                    onChange={(e) => handleUpdate(record.employeeId, 'overtimeHours', parseFloat(e.target.value))}
                                                    className="w-full p-2 border border-gray-200 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-gray-500">
                                                {record.weeklyOffs + record.holidays}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {record.isModified && (
                                                    <button
                                                        onClick={() => handleSaveRow(record.employeeId)}
                                                        className="text-primary hover:text-indigo-900 font-medium flex items-center gap-1 justify-end w-full"
                                                    >
                                                        <Save size={16} /> Save
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AttendanceSummaryManager;
