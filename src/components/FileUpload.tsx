
import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  compact?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (file && allowedTypes.includes(file.type)) {
      onFileSelect(file);
    } else if (file) {
      alert("Please upload a valid PDF or Image (JPG, PNG, WEBP).");
    }
  };

  const triggerInput = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div 
      onClick={triggerInput}
      className={`relative border border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center
        ${isProcessing ? 'border-slate-200 bg-slate-50 opacity-50' : 'border-indigo-300 hover:border-indigo-500 bg-white hover:shadow-sm'}
        ${compact ? 'p-4 h-24' : 'p-8 h-40'}
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <div className="flex flex-col items-center">
        <div className={`bg-indigo-50 p-2 rounded-full mb-2 ${compact ? 'scale-75' : ''}`}>
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-slate-800 uppercase tracking-tight`}>
          {isProcessing ? 'Processing...' : 'Upload PDF or Image'}
        </h3>
        {!compact && (
          <p className="mt-1 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            JPG, PNG, WEBP, PDF
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
