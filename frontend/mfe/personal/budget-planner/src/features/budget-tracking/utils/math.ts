export const evaluateExpression = (expression: string): number => {
    try {
        // Sanitize: only allow numbers, operators (+, -, *, /) and dots
        const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
        
        // Use Function instead of eval for a bit more safety in this sandbox
        // In a production app with more complex math, use a math library
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${sanitized}`)();
        
        return isFinite(result) ? result : 0;
    } catch (e) {
        return 0;
    }
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};
