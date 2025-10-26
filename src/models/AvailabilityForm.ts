// models/AvailabilityForm.ts
import mongoose, { Schema, Document } from "mongoose";

interface IAvailabilityForm extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string; // ✅ Store fullName directly
  week: string;
  availability: Map<string, string[]>;
  otherNotes: Map<string, string>;
  preferredPositions: string[];
  generalNotes: string;
  submittedAt: Date;
}

const AvailabilityFormSchema = new Schema<IAvailabilityForm>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  week: { type: String, required: true },
  availability: {
    type: Map,
    of: [String],
    default: {},
  },
  otherNotes: {
    type: Map,
    of: String,
    default: {},
  },
  preferredPositions: { type: [String], default: [] },
  generalNotes: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
});

// ✅ Compound index
AvailabilityFormSchema.index({ userId: 1, week: 1 }, { unique: true });
AvailabilityFormSchema.index({ week: 1 });

export default mongoose.models.AvailabilityForm ||
  mongoose.model<IAvailabilityForm>("AvailabilityForm", AvailabilityFormSchema);
