const { Schema, model } = require('mongoose');

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date, default: null },
    labels: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = model('Task', TaskSchema);
