import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true,
        maxlength: 5000
    },

    classification:{
        type: String,
        required: true,
        enum: ["SAFE", "SUSPICIOUS", "FRAUD", "CAUTION"],
        default: "SAFE"
    },

    signals:[{
        type: String,
        enum: ["SUSPICIOUS_LINK", "PRIZE_BAIT", "URGENCY"]
    }],
    
    explanation:{
        type: String,
        required: true
    },

    riskLevel:{
        type: String,
        required: true,
        enum: ["NONE","LOW", "MEDIUM", "HIGH"],
        default: "NONE"
    }
}, {timestamps: true});

messageSchema.index({ createdAt: -1 });
messageSchema.index({ classification: 1 });

export default mongoose.model("Message", messageSchema);