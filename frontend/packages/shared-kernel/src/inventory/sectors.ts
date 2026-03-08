import { BaseProduct } from './base';
import { ClothingAttributes, ElectronicsAttributes, GroceryAttributes, ServiceAttributes } from './attributes';

export interface TextileProduct extends BaseProduct, ClothingAttributes { }

export interface ElectronicsProduct extends BaseProduct, ElectronicsAttributes { }

export interface GroceryProduct extends BaseProduct, GroceryAttributes { }

export interface ServiceProduct extends BaseProduct, ServiceAttributes { }

export interface GeneralProduct extends BaseProduct, Partial<ClothingAttributes>, Partial<ElectronicsAttributes>, Partial<GroceryAttributes>, Partial<ServiceAttributes> { }
