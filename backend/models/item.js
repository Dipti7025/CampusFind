const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        // ==========================================
        // BASIC ITEM INFORMATION
        // ==========================================

        itemName: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true,
            enum: ["Lost", "Found"]
        },

        description: {
            type: String,
            required: true
        },

        location: {
            type: String,
            default: ""
        },

        date: {
            type: Date,
            required: true
        },

        contact: {
            type: String,
            required: true
        },

        image: {
            type: String,
            default: ""
        },

        // ==========================================
        // ITEM STATUS
        // ==========================================

        status: {
            type: String,
            default: "Active"
        },

        // ==========================================
        // EMERGENCY BROADCAST
        // Only used for Lost items
        // ==========================================

        isUrgent: {
            type: Boolean,
            default: false
        },

        // ==========================================
        // OWNERSHIP VERIFICATION
        // Used for Found items
        // ==========================================

        verificationMethod: {
            type: String,
            enum: [
                "none",
                "questions",
                "faceToFace"
            ],
            default: "none"
        },

        verificationQuestion1: {
            type: String,
            default: ""
        },

        verificationAnswer1: {
            type: String,
            default: ""
        },

        verificationQuestion2: {
            type: String,
            default: ""
        },

        verificationAnswer2: {
            type: String,
            default: ""
        }
    },

    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Item",
        itemSchema
    );