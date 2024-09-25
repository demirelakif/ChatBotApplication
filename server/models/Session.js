const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  bot: { type: String, required: true },
  user: { type: String, required: true }
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  responses: [responseSchema],
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
