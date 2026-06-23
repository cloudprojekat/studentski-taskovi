const mongoose = require('mongoose');
const Task = require('../models/Task');

exports.list = async (req, res, next) => {
  try {
    const { q, completed } = req.query;
    const filter = {};
    if (typeof completed !== 'undefined') filter.completed = completed === 'true';
    if (q) filter.title = { $regex: q, $options: 'i' };

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, completed, dueDate, labels } = req.body;
    if (!title || title.trim().length < 2) return res.status(400).json({ error: 'Title is required (min 2 chars)' });

    const task = await Task.create({ title, completed, dueDate, labels });
    res.status(201).json(task);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const payload = req.body;
    const task = await Task.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};
