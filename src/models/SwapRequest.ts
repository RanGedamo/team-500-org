import mongoose, { Schema, Document } from "mongoose";

export interface ISwapRequest extends Document {
  assignmentId: mongoose.Schema.Types.ObjectId;
  fromUserId: mongoose.Schema.Types.ObjectId;
  toUserId: mongoose.Schema.Types.ObjectId;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const SwapRequestSchema = new Schema<ISwapRequest>(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "swap_requests" },
);

export default mongoose.models.SwapRequest ||
  mongoose.model<ISwapRequest>("SwapRequest", SwapRequestSchema);
