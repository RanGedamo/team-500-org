// src/models/Assignment.ts
import mongoose, { Schema, Document, models } from "mongoose";

interface IAssignment extends Document {
  week: string;
  date: string;
  day: string;
  shift: string;
  position: string;
  slot: number;
  fullName: string; // ✅ Changed from name to fullName
  userId: string; // ✅ ADD userId field
  start: string;
  end: string;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    week: { type: String, required: true, index: true }, // 2025-09-22 (תחילת שבוע)
    date: { type: String, required: true }, // 2025-09-23 (יום ספציפי)
    day: { type: String, required: true }, // "ראשון" / "Monday" (לנוחות)
    shift: { type: String, required: true },
    position: { type: String, required: true },
    slot: { type: Number, required: true, min: 1 },
    fullName: { type: String, required: true }, // ✅ Changed from name to fullName
    userId: { type: String, required: true }, // ✅ ADD userId
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { timestamps: true },
);

// אינדקסים
AssignmentSchema.index(
  { date: 1, shift: 1, position: 1, slot: 1 },
  { unique: true }, // לא יותר משיבוץ אחד לכל slot ביום-משמרת-עמדה
);

AssignmentSchema.index({ userId: 1, date: 1 });
AssignmentSchema.index({ week: 1 });
AssignmentSchema.index({ date: 1 });
AssignmentSchema.index({ week: 1 , date: 1 });
AssignmentSchema.index({ week: 1, position: 1 });
AssignmentSchema.index({ userId: 1, date: 1 , position: 1 });
AssignmentSchema.index(
  { week: 1, date: 1, shift: 1, position: 1, slot: 1 },
  { unique: true },
);

// Auto-populate Hebrew day name
AssignmentSchema.pre("save", function (next) {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  if (this.date) {
    const dateObj = new Date(this.date);
    const jsDay = dateObj.getDay(); // Sunday=0, Monday=1, etc.
    this.day = days[jsDay]; // Direct mapping: Sunday (0) -> ראשון
  }

  next();
});

// Method to check for scheduling conflicts
AssignmentSchema.methods.hasConflict = async function () {
  const Model = this.constructor as mongoose.Model<any>;
  return await Model.findOne({
    userId: this.userId,
    date: this.date,
    _id: { $ne: this._id },
  });
};

export default models.Assignment ||
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);
