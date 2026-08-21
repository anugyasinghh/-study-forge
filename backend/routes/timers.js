const express = require('express');
const Timer = require('../models/Timer');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const timers = await Timer.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ timers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load timers.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subject, minutes } = req.body;
    const value = Number(minutes);
    if (!subject?.trim() || !Number.isFinite(value) || value < 1 || value > 600) {
      return res.status(400).json({ message: 'Enter a subject and a timer between 1 and 600 minutes.' });
    }

    const timer = await Timer.create({ userId: req.userId, subject: subject.trim(), minutes: value });
    res.status(201).json({ timer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create timer.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const timer = await Timer.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!timer) return res.status(404).json({ message: 'Timer not found.' });
    res.json({ message: 'Timer deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete timer.' });
  }
});

module.exports = router;
