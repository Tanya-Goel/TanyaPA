// models/Reminder.js - Enhanced to match requirements
import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  datetime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  // Keep some legacy fields for backward compatibility
  time: { 
    type: String, 
    required: false 
  },
  date: { 
    type: String, 
    required: false 
  },
  dateWord: {
    type: String,
    default: 'today',
    enum: ['today', 'tomorrow']
  },
  originalInput: { 
    type: String 
  },
  originalTime: {
    type: String
  },
  notified: {
    type: Boolean,
    default: false
  },
  // Voice reminder settings
  voiceEnabled: {
    type: Boolean,
    default: true
  },
  repeatCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  snoozeCount: {
    type: Number,
    default: 0
  },
  lastSnoozedAt: {
    type: Date
  },
  // Dismissal tracking
  completedAt: {
    type: Date
  },
  dismissedBy: {
    type: String,
    enum: ['voice', 'push', 'manual', 'auto'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Add indexes for better performance
reminderSchema.index({ datetime: 1 });
reminderSchema.index({ status: 1 });
reminderSchema.index({ date: 1 });
reminderSchema.index({ time: 1 });
reminderSchema.index({ notified: 1 });
reminderSchema.index({ text: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
