const express = require('express');
const User = require('../models/user');
const router = express.Router();

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Search for users
router.get('/search', authenticate, async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({ username: { $regex: username, $options: 'i' } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post('/friend-request', authenticate, async (req, res) => {
  const { recipientId } = req.body;
  try {
    const sender = await User.findById(req.userId);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to sender's requestsSent and recipient's requestsInbox
    sender.requestsSent.push(recipientId);
    recipient.requestsInbox.push(req.userId);

    await sender.save();
    await recipient.save();

    res.status(200).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/accept-request', authenticate, async (req, res) => {
  const { senderId } = req.body;
  try {
    const user = await User.findById(req.userId);
    const sender = await User.findById(senderId);

    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from requestsInbox and requestsSent
    user.requestsInbox = user.requestsInbox.filter(id => id !== senderId);
    sender.requestsSent = sender.requestsSent.filter(id => id !== req.userId);

    // Add to friends list
    user.friends.push(senderId);
    sender.friends.push(req.userId);

    await user.save();
    await sender.save();

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;