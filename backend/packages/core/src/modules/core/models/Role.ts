import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
    name: string; // Display Name (e.g., "Senior Staff", "Biller")
    code: string; // Unique Code (e.g., "SENIOR_STAFF")
    description?: string;
    systemRole: string; // Maps to SystemRole enum (e.g., "staff", "manager")
    tenantId?: mongoose.Types.ObjectId; // If null, it's a global system role
    isSystem: boolean; // True if it's a default system role
    permissions: string[]; // List of permission codes
    isActive: boolean;
}

const RoleSchema = new Schema<IRole>({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    systemRole: { type: String, required: true }, // validated against SystemRole enum in usage, not strict schema here to avoid import cycles
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Composite index to ensure unique role codes per tenant (or globally if system role)
RoleSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const Role = mongoose.model<IRole>('Role', RoleSchema);
export default Role;
