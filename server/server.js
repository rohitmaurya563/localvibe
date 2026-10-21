
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "./models/Event.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Backend status
app.get("/", (req, res) => {
  res.json({
    message: "LocalVibe backend is running successfully!",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected"
  });
});

// Get all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message
    });
  }
});

// Create a new event
app.post("/api/events", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      date,
      time,
      imageUrl,
      price,
      organizer
    } = req.body;

    const event = await Event.create({
      title,
      description,
      category,
      location,
      date,
      time,
      imageUrl,
      price,
      organizer
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event
    });
  } catch (error) {
    const isValidationError = error.name === "ValidationError";

    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError
        ? "Please provide all required fields correctly"
        : "Failed to create event",
      error: error.message
    });
  }
});

app.post("/api/events/:id/going", async (req, res) => {
  try {
    const { userId } = req.body;

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid userId is required"
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const alreadyGoing = event.goingUsers.includes(userId);

    if (alreadyGoing) {
      event.goingUsers = event.goingUsers.filter(
        (id) => id !== userId
      );
    } else {
      event.goingUsers.push(userId);
    }

    await event.save();

    res.status(200).json({
      success: true,
      going: !alreadyGoing,
      goingCount: event.goingUsers.length,
      message: alreadyGoing
        ? "Going status removed"
        : "Going status saved"
    });
  } catch (error) {
    console.error("Going API error:", error.message);

    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: "Unable to update Going status"
    });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`LocalVibe server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
