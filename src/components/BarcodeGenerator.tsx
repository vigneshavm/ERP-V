import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    displayValue?: boolean;
    className?: string;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
    value,
    format = 'CODE128',
    width = 1.5,
    height = 50,
    fontSize = 14,
    displayValue = true,
    className
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            try {
                JsBarcode(svgRef.current, value, {
                    format: format,
                    width: width,
                    height: height,
                    displayValue: displayValue,
                    fontSize: fontSize,
                    margin: 0,
                    textMargin: 5
                });
            } catch (error) {
                console.error("Barcode generation failed", error);
            }
        }
    }, [value, format, width, height, fontSize, displayValue]);

    return <svg ref={svgRef} className={className} />;
};

export default BarcodeGenerator;
