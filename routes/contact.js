
const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');


router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, message) are required.'
      });
    }

    const newContact = new Contact({ name, email, message });
    await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Message received successfully.',
      contact: newContact
    });
  } catch (err) {
    next(err); 
  }
});

module.exports = router;
