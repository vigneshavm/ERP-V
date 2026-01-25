export const SECTOR_SEEDS: Record<string, any[]> = {
    Stationery: [
        // stationery may be retail or wholesale
        { name: "Generic Notebook", sku: "RET-NOTE-001", category: "Stationery", costPrice: 20, sellingPrice: 50, stockQty: 100, unit: "pcs" },
        { name: "Ball Pen Blue", sku: "RET-PEN-001", category: "Stationery", costPrice: 5, sellingPrice: 10, stockQty: 200, unit: "pcs" },
        { name: "Water Bottle 1L", sku: "RET-BOT-001", category: "General", costPrice: 50, sellingPrice: 120, stockQty: 50, unit: "pcs" },
    ],
    grocery: [
        // grocery may be retail or wholesale
        { name: "Rice 5kg Bag", sku: "GRO-RICE-005", category: "Grains", costPrice: 200, sellingPrice: 350, stockQty: 50, unit: "bag" },
        { name: "Sunflower Oil 1L", sku: "GRO-OIL-001", category: "Oil", costPrice: 110, sellingPrice: 140, stockQty: 100, unit: "pouch" },
        { name: "Wheat Flour 5kg", sku: "GRO-ATTA-005", category: "Flour", costPrice: 180, sellingPrice: 240, stockQty: 40, unit: "bag" },
        { name: "Sugar 1kg", sku: "GRO-SUG-001", category: "Sweeteners", costPrice: 38, sellingPrice: 45, stockQty: 100, unit: "kg" },
        { name: "Rice 25kg Bag", sku: "WHO-RICE-025", category: "Grains", costPrice: 900, sellingPrice: 1100, stockQty: 100, unit: "bag" },
        { name: "Sugar 50kg Bag", sku: "WHO-SUG-050", category: "Sweeteners", costPrice: 1800, sellingPrice: 2100, stockQty: 50, unit: "bag" },
    ],
    electronics: [
        // electronics may be retail or wholesale
        { name: "Smartphone 128GB", sku: "ELE-PHN-001", category: "Smartphone", costPrice: 10000, sellingPrice: 15000, stockQty: 10, unit: "pcs" },
        { name: "Bluetooth Earbuds", sku: "ELE-EAR-001", category: "Accessories", costPrice: 800, sellingPrice: 1500, stockQty: 20, unit: "pcs" },
        { name: "USB-C Cable", sku: "ELE-CAB-001", category: "Accessories", costPrice: 100, sellingPrice: 250, stockQty: 50, unit: "pcs" },
    ],
    pharmacy: [
        // pharmacy may be retail or wholesale
        { name: "Paracetamol 650mg", sku: "MED-PARA-650", category: "Analgesic", costPrice: 10, sellingPrice: 25, stockQty: 500, unit: "strip" },
        { name: "Cough Syrup 100ml", sku: "MED-COUG-100", category: "Syrup", costPrice: 40, sellingPrice: 85, stockQty: 100, unit: "bottle" },
        { name: "Vitamin C Tablets", sku: "MED-VITC-001", category: "Supplements", costPrice: 15, sellingPrice: 40, stockQty: 200, unit: "strip" },
    ],
    textile: [
        // textile may be retail or wholesale
        { name: "Cotton Shirt", sku: "TEX-SHR-001", category: "Mens Wear", costPrice: 300, sellingPrice: 700, stockQty: 50, unit: "pcs" },
        { name: "Jeans Blue", sku: "TEX-JNS-001", category: "Mens Wear", costPrice: 500, sellingPrice: 1200, stockQty: 40, unit: "pcs" },
        { name: "Silk Saree", sku: "TEX-SAR-001", category: "Womens Wear", costPrice: 2000, sellingPrice: 4500, stockQty: 15, unit: "pcs" },
    ],
    restaurant: [
        // restaurant may be retail or wholesale
        { name: "Chicken Biryani", sku: "RES-BIR-001", category: "Main Course", costPrice: 100, sellingPrice: 250, stockQty: 0, unit: "plate" },
        { name: "Veg Fried Rice", sku: "RES-RIC-001", category: "Chinese", costPrice: 60, sellingPrice: 150, stockQty: 0, unit: "plate" },
        { name: "Mineral Water", sku: "RES-WAT-001", category: "Beverage", costPrice: 10, sellingPrice: 20, stockQty: 100, unit: "bottle" },
    ],
    healthcare: [
        // healthcare may be retail or wholesale
        { name: "Digital Thermometer", sku: "HLT-THERM-001", category: "Device", costPrice: 150, sellingPrice: 300, stockQty: 20, unit: "pcs" },
        { name: "N95 Mask", sku: "HLT-MASK-001", category: "Protection", costPrice: 20, sellingPrice: 50, stockQty: 100, unit: "pcs" },
    ],

};
