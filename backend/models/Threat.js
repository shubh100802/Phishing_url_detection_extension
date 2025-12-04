import mongoose from 'mongoose';

const threatSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, index: true, trim: true, lowercase: true },
    level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    status: { type: String, enum: ['blocked', 'investigating', 'monitored'], default: 'investigating' },
    notes: { type: String, default: '' },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

threatSchema.index({ url: 1 });

const Threat = mongoose.model('Threat', threatSchema);
export default Threat;
