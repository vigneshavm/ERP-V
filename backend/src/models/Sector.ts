import mongoose, { Document, Schema } from 'mongoose';

export interface ISector extends Document {
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const sectorSchema = new Schema<ISector>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Sector = mongoose.model<ISector>('Sector', sectorSchema);

export default Sector;
