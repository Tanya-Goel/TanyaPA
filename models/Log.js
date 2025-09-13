// models/Log.js
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  action: { 
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
}, {
  timestamps: true
});

// Add indexes for better performance
logSchema.index({ date: 1 });
logSchema.index({ action: 1 });

const Log = mongoose.model("Log", logSchema);

export default Log;
