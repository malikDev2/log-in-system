const express = require('express');
const User = require('../models/user'); 
const jwt = require('jsonwebtoken');
const router = express.Router();

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// User search
router.get('/search', authenticate, async (req, res) => {
  try {
    const { username } = req.query;
    const users = await User.find({ username: { $regex: username, $options: 'i' } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Friend request
router.post('/friend-request', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const sender = await User.findById(req.userId);
    const recipient = await User.findById(recipientId);

    if (!recipient) return res.status(404).json({ message: 'User not found' });

    if (recipient.requestsInbox.includes(req.userId)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    sender.requestsSent.push(recipientId);
    recipient.requestsInbox.push(req.userId);
    await sender.save();
    await recipient.save();

    res.status(200).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept request
router.post('/accept-request', authenticate, async (req, res) => {
  try {
    const { senderId } = req.body;
    const user = await User.findById(req.userId);
    const sender = await User.findById(senderId);

    if (!sender) return res.status(404).json({ message: 'User not found' });

    user.requestsInbox = user.requestsInbox.filter(id => id.toString() !== senderId);
    sender.requestsSent = sender.requestsSent.filter(id => id.toString() !== req.userId);

    user.friends.push(senderId);
    sender.friends.push(req.userId);

    await user.save();
    await sender.save();

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline request
router.post('/decline-request', authenticate, async (req, res) => {
  try {
    const { senderId } = req.body;
    const user = await User.findById(req.userId);

    user.requestsInbox = user.requestsInbox.filter(id => id.toString() !== senderId);
    await user.save();

    const sender = await User.findById(senderId);
    if (sender) {
      sender.requestsSent = sender.requestsSent.filter(id => id.toString() !== req.userId);
      await sender.save();
    }

    res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username');;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inbox requests with usernames
router.get('/requests', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const senders = await User.find({ _id: { $in: user.requestsInbox } }, 'username');

    const requests = senders.map(sender => ({
      senderId: sender._id,
      senderUsername: sender.username
    }));

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
