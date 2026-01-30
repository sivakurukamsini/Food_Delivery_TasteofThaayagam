import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Message from '../models/messageModel.js';
import { connectDB } from '../config/db.js';

const run = async () => {
  try {
    await connectDB();
    const msgs = await Message.find().sort({ createdAt: -1 }).limit(20);
    console.log('Latest messages:');
    msgs.forEach((m) => console.log(`${m._id} | ${m.name} <${m.email}> | read=${m.read} | ${m.subject} | ${m.message}`));
    process.exit(0);
  } catch (err) {
    console.error('Error listing messages:', err);
    process.exit(1);
  }
};

run();
