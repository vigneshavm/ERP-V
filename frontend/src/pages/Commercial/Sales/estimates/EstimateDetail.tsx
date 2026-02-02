import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../../../components/shared/Layout/Layout";
import api from "../../../../services/api";
import { toast } from "react-toastify";
import EstimateTemplate from "@/components/Sales/EstimateTemplate";
import { ArrowLeft, Printer, FileText } from 'lucide-react';

const EstimateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEstimate();
  }, [id]);

  const fetchEstimate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      const response = await api.get(
        `/api/estimates/${id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setEstimate(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch estimate");
      navigate("/sales/estimates");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !estimate) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Loading estimate...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in pb-10">
        {/* Header - Hidden on print */}
        <div className="mb-8 print:hidden">
          <button
            onClick={() => navigate("/sales/estimates")}
            className="flex items-center text-slate-600 hover:text-indigo-600 mb-4 transition-colors font-medium gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Estimates
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Estimate Details
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View and print estimate
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Estimate Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          <EstimateTemplate estimate={estimate} />
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default EstimateDetail;
