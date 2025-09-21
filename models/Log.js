// models/Log.js - Enhanced to match requirements
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  category: {
    type: String,
    required: false,
    default: 'general'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better performance
logSchema.index({ createdAt: 1 });
logSchema.index({ category: 1 });
logSchema.index({ text: 1 });

const Log = mongoose.model("Log", logSchema);

export default Log;
