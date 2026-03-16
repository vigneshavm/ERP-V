import mongoose, { Schema } from 'mongoose';
const RoleSchema = new Schema({
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
const Role = mongoose.model('Role', RoleSchema);
export default Role;
