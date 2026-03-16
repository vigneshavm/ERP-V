import mongoose, { Schema } from 'mongoose';
const sectorSchema = new Schema({
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
const Sector = mongoose.model('Sector', sectorSchema);
export default Sector;
