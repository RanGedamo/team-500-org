// src/models/DefaultPosition.ts
import mongoose from "mongoose";

const defaultPositionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
});

export default mongoose.models.DefaultPosition ||
  mongoose.model("DefaultPosition", defaultPositionSchema);
