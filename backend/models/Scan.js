import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    verdict: { type: String, enum: ['safe', 'suspicious', 'malicious'], required: true },
    score: { type: Number, min: 0, max: 1, default: 0 },
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    url: { type: String, required: true, index: true, trim: true, lowercase: true },
    verdict: { type: String, enum: ['safe', 'suspicious', 'malicious'], required: true },
    riskScore: { type: Number, min: 0, max: 1, required: true },
    sources: { type: [sourceSchema], default: [] },
    options: {
      deepScan: { type: Boolean, default: false },
      saveHistory: { type: Boolean, default: true },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

scanSchema.index({ url: 1, createdAt: -1 });

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;
