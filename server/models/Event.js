
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    organizer: {
      type: String,
      default: ""
    },
    goingUsers: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
