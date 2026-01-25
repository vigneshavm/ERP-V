import React from 'react';

interface AuthAlertProps {
    type: 'error' | 'success';
    title?: string;
    message: string;
}

const AuthAlert: React.FC<AuthAlertProps> = ({ type, title, message }) => {
    if (!message) return null;

    const isError = type === 'error';
    const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
    const borderColor = isError ? 'border-red-500' : 'border-green-500';
    const textColor = isError ? 'text-red-800' : 'text-green-800';
    const subTextColor = isError ? 'text-red-700' : 'text-green-700';
    const iconColor = isError ? 'text-red-400' : 'text-green-400';

    return (
        <div className={`rounded-md ${bgColor} p-4 border-l-4 ${borderColor}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    {isError ? (
                        <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
                <div className="ml-3">
                    {title && <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>}
                    <div className={`mt-2 text-sm ${subTextColor}`}>
                        <p>{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthAlert;
