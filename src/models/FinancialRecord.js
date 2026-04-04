const mongoose = require("mongoose");

const financialRecordSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },
    date: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("FinancialRecord", financialRecordSchema);
