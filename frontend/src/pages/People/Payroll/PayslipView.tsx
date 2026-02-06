import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../../components/shared/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { ArrowLeft, Printer, Download, Mail, Send, DollarSign, Calendar } from 'lucide-react';
import { formatDateISO } from '../../../utils/helpers';
import api from '../../../services/api';
const PayslipView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const payslip = location.state?.payslip;

    // Simple mock toast for now to avoid dependency issues if package missing
    const showToast = (msg: string, type: 'success' | 'error') => {
        alert(`${type.toUpperCase()}: ${msg}`);
    };

    if (!payslip) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-screen">
                    <p className="text-gray-500 mb-4">No Payslip Data Found</p>
                    <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline">Go Back</button>
                </div>
            </Layout>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = async () => {
        try {
            await api.post(`/api/hr/payroll/payslips/${payslip._id}/send`, { channels: ['EMAIL'] });
            showToast('Payslip queued for email delivery', 'success');
        } catch (error) {
            showToast('Failed to send email', 'error');
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
                <div className="print:hidden mb-6">
                    <PageHeader
                        title={`Payslip: ${payslip.employeeId?.name || 'Unknown'}`}
                        description={`Period: ${payslip.month}/${payslip.year}`}
                        breadcrumbs={[
                            { label: 'Payroll', link: '/people/payroll' },
                            { label: 'Run Details', link: -1 as any }, // Go back
                            { label: 'View Payslip' }
                        ]}
                        actions={
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                                    <Printer size={16} /> Print
                                </button>
                                <button onClick={handleEmail} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    <Mail size={16} /> Email
                                </button>
                            </div>
                        }
                    />
                </div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 print:shadow-none print:border-0">
                    {/* Header */}
                    <div className="bg-indigo-900 text-white p-8 print:bg-gray-100 print:text-black">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold mb-1">PAYSLIP</h1>
                                <p className="opacity-80 text-sm">Confidential</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold">BizzAI Inc.</h2>
                                <p className="text-sm opacity-80">123 Business Street, Tech City</p>
                                <p className="text-sm opacity-80">Registration: 12345678</p>
                            </div>
                        </div>
                    </div>

                    {/* Employee & Period Details */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Employee Details</h3>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg text-gray-900">{payslip.employeeId?.name}</p>
                                    <p className="text-sm text-gray-500">Role: {payslip.employeeId?.role || 'Staff'}</p>
                                    <p className="text-sm text-gray-500">ID: {payslip.employeeId?._id?.substring(0, 8).toUpperCase()}</p>
                                    <p className="text-sm text-gray-500">Bank: {payslip.bankDetailsSnapshot?.bankName || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">A/C: {payslip.bankDetailsSnapshot?.accountNumber ? `****${payslip.bankDetailsSnapshot.accountNumber.slice(-4)}` : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pay Period</h3>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-gray-900">{new Date(0, payslip.month).toLocaleString('default', { month: 'long' })} {payslip.year}</p>
                                    <div className="flex justify-end gap-4 mt-2">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase">Paid Days</p>
                                            <p className="font-bold">{payslip.daysPresent}/{payslip.daysTotal}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase">Payment Date</p>
                                            <p className="font-bold">{payslip.paymentDate ? formatDateISO(payslip.paymentDate) : 'Pending'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Earnings & Deductions Table */}
                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-12">
                            {/* Earnings */}
                            <div>
                                <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 border-b border-green-100 pb-2">Earnings</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr>
                                            <td className="py-2 text-gray-600">Basic Salary</td>
                                            <td className="py-2 text-right font-medium text-gray-900">₹{payslip.basicSalary?.toLocaleString() || 0}</td>
                                        </tr>
                                        {payslip.earnings.map((e: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-2 text-gray-600">{e.name}</td>
                                                <td className="py-2 text-right font-medium text-gray-900">₹{e.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-t border-gray-100">
                                            <td className="py-3 font-bold text-gray-900">Gross Earnings</td>
                                            <td className="py-3 text-right font-bold text-gray-900">₹{payslip.grossPay?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Deductions */}
                            <div>
                                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-4 border-b border-red-100 pb-2">Deductions</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {payslip.deductions.map((d: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-2 text-gray-600">{d.name}</td>
                                                <td className="py-2 text-right font-medium text-gray-900">₹{d.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {payslip.deductions.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="py-2 text-gray-400 italic">No deductions</td>
                                            </tr>
                                        )}
                                        <tr className="border-t border-gray-100" style={{ marginTop: 'auto' }}>
                                            <td className="py-3 font-bold text-gray-900">Total Deductions</td>
                                            <td className="py-3 text-right font-bold text-red-600">-₹{payslip.totalDeductions?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-end">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-500 mb-1">Net Payable Amount</p>
                            <h2 className="text-3xl font-bold text-indigo-900">₹{payslip.netPay?.toLocaleString()}</h2>
                            <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide font-medium">
                                {payslip.paymentStatus === 'PAID' ? 'PAID via Bank Transfer' : 'PAYMENT PENDING'}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">Computer generated payslip. No signature required.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PayslipView;
