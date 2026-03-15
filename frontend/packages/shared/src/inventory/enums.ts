export const ProductUnit = {
    PIECE: "Piece",
    METER: "Meter",
    SET: "Set",
    CYLINDER: "Cylinder",
    BOX: "Box",
    KG: "Kg",
    LITER: "Liter",
    SERVICE: "Service",
    BAG: "Bag",
    DOZEN: "Dozen"
} as const;

export type ProductUnit = typeof ProductUnit[keyof typeof ProductUnit];

export const TaxMode = {
    EXCLUSIVE: 'EXCLUSIVE',
    INCLUSIVE: 'INCLUSIVE'
} as const;


export const PaymentMethod = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];
