// models/Reminder.js
import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  originalInput: { 
    type: String 
  }, // Store the original natural language input
  completed: { 
    type: Boolean, 
    default: false 
  },
}, {
  timestamps: true
});

// Add indexes for better performance
reminderSchema.index({ date: 1 });
reminderSchema.index({ completed: 1 });
reminderSchema.index({ text: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
