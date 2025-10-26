import mongoose from "mongoose";

// Position.ts
const PositionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // שם ברור בלבד
  order: { type: Number, required: true },
  weekDate: { type: String, required: true },
});

// והייתי שם unique compound index:
PositionSchema.index({ name: 1, weekDate: 1 }, { unique: true });
PositionSchema.index({ order: 1 });



export default mongoose.models.Position ||
  mongoose.model("Position", PositionSchema);
