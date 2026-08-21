const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load notes.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Note title is required.' });

    const note = await Note.create({
      userId: req.userId,
      title: title.trim(),
      content: (content || '').trim(),
      color: color || '#f4f1ea',
    });
    res.status(201).json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create note.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title: title?.trim(), content: (content || '').trim(), color: color || '#f4f1ea' },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    res.json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update note.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    res.json({ message: 'Note deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete note.' });
  }
});

module.exports = router;
