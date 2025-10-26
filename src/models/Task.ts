// src/models/Task.ts
import mongoose, { models } from "mongoose";

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weekDate: { type: String, required: true },
  date: { type: String, required: true },
  userId: { type: String, required: true },
  fullName: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
});

TaskSchema.index(
  { userId: 1, date: 1, name: 1 },
  { unique: true } 
);
TaskSchema.index({ weekDate: 1 });   
TaskSchema.index({ name: 1, weekDate: 1 })
;
const Task = models.Task || mongoose.model("Task", TaskSchema);
export default Task;
