export interface ClothingAttributes {
    size?: string; // S, M, L, XL, 40, 42
    sizeType?: string; // US, UK, EU, CMS
    color?: string;
    material?: string; // Cotton, Polyester
    fit?: string; // Slim, Regular
    sleeve?: string; // Half, Full
    pattern?: string; // Solid, Checked
    gender?: string; // Men, Women, Kids
    neck?: string; // Round, V-Neck
    collar?: string;
    style?: string;
    waist?: string;
    length?: string;
    composition?: string;
}

export interface ElectronicsAttributes {
    model?: string;
    capacity?: string; // 1.5 Ton, 64GB
    warrantyPeriod?: string;
    powerConsumption?: string;
    starRating?: number;
    serialNumber?: string;
}

export interface GroceryAttributes {
    weight?: string; // 1kg, 500g
    volume?: string; // 1L, 500ml
    flavor?: string;
    dietaryInfo?: string; // Veg, Non-Veg, Vegan
    packSize?: string;
}

export interface ServiceAttributes {
    duration?: string; // 1 Hour, 2 Days
    serviceType?: 'OneTime' | 'Subscription';
    provider?: string;
}
