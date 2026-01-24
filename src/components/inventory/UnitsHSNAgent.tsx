import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    ArrowRight,
    HelpCircle,
    Info,
    RotateCcw,
    Zap,
    Download,
    Scale,
    Trash2,
    Edit2,
    FileText,
} from 'lucide-react';

// --- Types ---

type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_AUDIT';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface HSNAuditResult {
    sku: string;
    item_name: string;
    category: string;
    hsn_code: string;
    hsn_description: string;
    system_gst: number;
    government_gst: number;
    status: ComplianceStatus;
    issue: string | null;
    risk_level: RiskLevel;
    recommended_fix: string | null;
    unit_of_measure: string;
    allowed_units: string[];
}

interface HSNMasterEntry {
    hsn_code: string;
    description: string;
    default_gst_rate: number;
    allowed_units: string[];
}

// --- Mock Government Data ---
const GOVT_HSN_MASTER: Record<string, HSNMasterEntry> = {
    '6105': { hsn_code: '6105', description: "Men's Cotton Shirts", default_gst_rate: 12, allowed_units: ['Piece', 'Dozen'] },
    '6109': { hsn_code: '6109', description: "T-Shirts, Singlets", default_gst_rate: 12, allowed_units: ['Piece'] },
    '6203': { hsn_code: '6203', description: "Men's Trousers, Suits", default_gst_rate: 12, allowed_units: ['Piece', 'Set'] },
    '5208': { hsn_code: '5208', description: "Cotton Fabric (Woven)", default_gst_rate: 5, allowed_units: ['Meter', 'Kg'] },
    '9403': { hsn_code: '9403', description: "Other Furniture & Parts", default_gst_rate: 18, allowed_units: ['Piece', 'Set'] },
    '2202': { hsn_code: '2202', description: "Non-Alcoholic Beverages", default_gst_rate: 28, allowed_units: ['Liter', 'Box', 'Bottle'] }
};

const UnitsHSNAgent: React.FC = () => {
    const { products } = useSelector((state: RootState) => state.inventory);
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'ALL'>('ALL');

    // --- Intelligence Engine ---
    const auditResults: HSNAuditResult[] = useMemo(() => {
        return products.map(product => {
            const hsn = product.hsnCode || 'MISSING';
            const govtData = GOVT_HSN_MASTER[hsn];

            let status: ComplianceStatus = 'COMPLIANT';
            let issue: string | null = null;
            let risk_level: RiskLevel = 'LOW';
            let recommended_fix: string | null = null;

            if (!product.hsnCode) {
                status = 'NON_COMPLIANT';
                issue = 'Missing HSN Code';
                risk_level = 'CRITICAL';
                recommended_fix = 'Assign valid HSN from lookup';
            } else if (!govtData) {
                status = 'NON_COMPLIANT';
                issue = 'Invalid HSN Code (Not in Master)';
                risk_level = 'HIGH';
                recommended_fix = 'Verify and correct HSN Code';
            } else {
                // Check GST Mismatch
                const systemGst = product.gstPercentage || 0;
                if (systemGst !== govtData.default_gst_rate) {
                    status = 'NON_COMPLIANT';
                    issue = 'GST rate mismatch';
                    risk_level = 'HIGH';
                    recommended_fix = `Update GST to ${govtData.default_gst_rate}%`;
                }

                // Check Unit Compliance
                const unit = product.unit || 'Piece';
                if (!govtData.allowed_units.includes(unit)) {
                    status = 'NON_COMPLIANT';
                    issue = issue ? `${issue} & Unit mismatch` : 'Unit Mismatch for HSN';
                    risk_level = risk_level === 'HIGH' ? 'CRITICAL' : 'MEDIUM';
                    recommended_fix = recommended_fix ? `${recommended_fix}. Correct Unit to ${govtData.allowed_units[0]}` : `Change Unit to ${govtData.allowed_units[0]}`;
                }
            }

            return {
                sku: product.sku,
                item_name: product.name,
                category: product.category,
                hsn_code: hsn,
                hsn_description: govtData?.description || 'N/A',
                system_gst: product.gstPercentage || 0,
                government_gst: govtData?.default_gst_rate || 0,
                status,
                issue,
                risk_level,
                recommended_fix,
                unit_of_measure: product.unit || 'Piece',
                allowed_units: govtData?.allowed_units || []
            };
        });
    }, [products]);

    const filteredAudit = useMemo(() => {
        return auditResults.filter(a => {
            const matchesSearch = a.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.sku.toLowerCase().includes(searchTerm.toLowerCase()) || a.hsn_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            const riskMap = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            return riskMap[a.risk_level] - riskMap[b.risk_level];
        });
    }, [auditResults, searchTerm, statusFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const nonCompliant = auditResults.filter(a => a.status === 'NON_COMPLIANT');
        return {
            total: auditResults.length,
            nonCompliant: nonCompliant.length,
            criticalRisk: nonCompliant.filter(a => a.risk_level === 'CRITICAL').length,
            gstMismatches: nonCompliant.filter(a => a.issue?.includes('GST')).length,
            complianceScore: auditResults.length > 0 ? Math.round(((auditResults.length - nonCompliant.length) / auditResults.length) * 100) : 100
        };
    }, [auditResults]);

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Scale className="w-6 h-6 text-primary" />
                        Units & HSN Intelligence Agent
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        GST Compliance Audit & HSN Verification Engine for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Audit
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Run Full Audit
                    </button>
                </div>
            </div>

            {/* Compliance Score Ribbon */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-100 dark:text-neutral-700" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 * (1 - metrics.complianceScore / 100)}
                                className={`${metrics.complianceScore > 90 ? 'text-success' : metrics.complianceScore > 75 ? 'text-warning' : 'text-error'} transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black">{metrics.complianceScore}%</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Health</span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                        <div className="text-center md:text-left">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Non-Compliant</p>
                            <h3 className={`text-2xl font-bold ${metrics.nonCompliant > 0 ? 'text-error' : 'text-success'}`}>{metrics.nonCompliant}</h3>
                        </div>
                        <div className="text-center md:text-left border-l border-neutral-100 dark:border-neutral-700 pl-6">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Critical Issues</p>
                            <h3 className="text-2xl font-bold">{metrics.criticalRisk}</h3>
                        </div>
                        <div className="text-center md:text-left border-l border-neutral-100 dark:border-neutral-700 pl-6">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">GST Mismatches</p>
                            <h3 className="text-2xl font-bold text-warning">{metrics.gstMismatches}</h3>
                        </div>
                        <div className="text-center md:text-left border-l border-neutral-100 dark:border-neutral-700 pl-6">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Audit Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <ShieldCheck className="w-5 h-5 text-success" />
                                <span className="text-sm font-bold text-success capitalize">Active Guard</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search SKU, Item Name or HSN..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none font-medium"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Audit Status</option>
                        <option value="COMPLIANT">Compliant Only</option>
                        <option value="NON_COMPLIANT">Non-Compliant Only</option>
                    </select>
                </div>
            </div>

            {/* Audit List */}
            <div className="space-y-4">
                {filteredAudit.map((item) => (
                    <div
                        key={item.sku}
                        className={`group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700/30 ${item.status === 'NON_COMPLIANT' ? 'border-l-4 border-l-error shadow-sm' : ''
                            }`}
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Product Info */}
                            <div className="lg:w-1/3">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${item.status === 'COMPLIANT' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                        {item.status === 'COMPLIANT' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-neutral-900 dark:text-white group-hover:text-primary transition-colors">{item.item_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono text-neutral-400 uppercase tracking-tighter">{item.sku}</span>
                                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                            <span className="text-xs text-neutral-500">{item.category}</span>
                                        </div>
                                    </div>
                                </div>

                                {item.issue && (
                                    <div className="mt-4 p-3 bg-error/5 border border-error/10 rounded-xl">
                                        <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-1">Violation Log</p>
                                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{item.issue}</p>
                                    </div>
                                )}
                            </div>

                            {/* Compliance Details */}
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-700 lg:pl-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase px-1">HSN Code</p>
                                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg group-hover:bg-white dark:group-hover:bg-neutral-800 transition-colors">
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">{item.hsn_code}</p>
                                        <p className="text-[9px] text-neutral-500 truncate mt-0.5">{item.hsn_description}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase px-1">GST Audit</p>
                                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg group-hover:bg-white dark:group-hover:bg-neutral-800 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{item.system_gst}%</span>
                                            {item.status === 'NON_COMPLIANT' && (
                                                <>
                                                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                                                    <span className="text-sm font-bold text-success">{item.government_gst}%</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-neutral-500 mt-0.5">System vs Govt</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase px-1">Unit Policy</p>
                                    <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg group-hover:bg-white dark:group-hover:bg-neutral-800 transition-colors">
                                        <p className="text-sm font-bold">{item.unit_of_measure}</p>
                                        <p className="text-[9px] text-neutral-500 mt-0.5">{item.allowed_units.join(', ')}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase px-1">Risk Exposure</p>
                                    <div className="flex items-center gap-2 p-2">
                                        <div className={`w-2 h-2 rounded-full ${item.risk_level === 'CRITICAL' ? 'bg-error animate-pulse' :
                                                item.risk_level === 'HIGH' ? 'bg-error' :
                                                    item.risk_level === 'MEDIUM' ? 'bg-warning' : 'bg-success'
                                            }`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${item.risk_level === 'CRITICAL' || item.risk_level === 'HIGH' ? 'text-error' :
                                                item.risk_level === 'MEDIUM' ? 'text-warning' : 'text-success'
                                            }`}>{item.risk_level}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Intelligent Actions */}
                            <div className="lg:w-1/4 flex flex-col justify-center gap-2 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-700 pt-4 lg:pt-0 lg:pl-6">
                                {item.status === 'NON_COMPLIANT' ? (
                                    <>
                                        <button className="w-full flex items-center justify-between px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all">
                                            <span>Quick Compliance Fix</span>
                                            <Zap className="w-3.5 h-3.5 fill-current" />
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 rounded-lg text-[10px] font-bold transition-all">
                                                <Edit2 className="w-3 h-3" /> Edit Item
                                            </button>
                                            <button className="p-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 rounded-lg text-neutral-400 hover:text-error transition-all">
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 opacity-50">
                                        <ShieldCheck className="w-8 h-8 text-success mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-success">Compliant</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Wings Integration Panel */}
            <div className="bg-neutral-950 text-white p-8 rounded-[2rem] border border-neutral-800 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                    <FileText className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                    <div className="lg:w-2/3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[10px] font-black uppercase tracking-widest mb-6">
                            <Zap className="w-3 h-3 fill-current" /> Wings Compliance AI
                        </div>
                        <h4 className="text-3xl font-black leading-tight mb-4">
                            Prevent GST Notices with <br />
                            <span className="text-primary italic">Live HSN Guard.</span>
                        </h4>
                        <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
                            Our compliance agent has identified <span className="text-white font-bold">{metrics.gstMismatches} items</span> with mismatched GST rates and <span className="text-white font-bold">{metrics.criticalRisk} high-risk</span> violations.
                            Failure to rectify these could lead to audit issues during GSTR filing.
                        </p>
                    </div>

                    <div className="lg:w-1/3 w-full flex flex-col gap-3">
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            <Zap className="w-5 h-5 fill-current" /> Auto-Correction Mode
                        </button>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-sm transition-all">
                            Download GSTR-Ready Audit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitsHSNAgent;
