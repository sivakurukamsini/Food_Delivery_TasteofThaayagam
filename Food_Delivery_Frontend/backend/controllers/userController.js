import userModel from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ========================
// USER AUTH FUNCTIONS
// ========================

// Register user
const registerUser = async (req, res) => {
  const { firstName, lastName, name, email, password, phone } = req.body;
  // Support either firstName/lastName or legacy name
  const finalName = name || ((firstName || lastName) ? `${firstName || ''} ${lastName || ''}`.trim() : '');
  try {
    // Prevent public registration of the reserved admin account
    const RESERVED_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    if (email && email.toLowerCase() === RESERVED_ADMIN_EMAIL.toLowerCase()) {
      return res.json({ success: false, message: 'This email address is reserved' });
    }

    const exists = await userModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "User already exists" });

    if (!finalName || !email || !password)
      return res.json({ success: false, message: "All fields are required" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new userModel({ firstName, lastName, name: finalName, email, phone, password: hashedPassword });
    await newUser.save();

    // Create auth token and return minimal user data so frontend can auto-login
    const token = jwt.sign({ id: newUser._id, isAdmin: !!newUser.isAdmin }, process.env.JWT_SECRET || "secret123", { expiresIn: "1d" });
    res.json({ success: true, message: "User registered successfully", token, user: { id: newUser._id, firstName: newUser.firstName, lastName: newUser.lastName, name: newUser.name, email: newUser.email, phone: newUser.phone } });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error registering user" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Incorrect password" });

    // include isAdmin flag in token payload and response
    const token = jwt.sign({ id: user._id, isAdmin: !!user.isAdmin }, process.env.JWT_SECRET || "secret123", { expiresIn: "1d" });

res.json({ 
  success: true, 
  token, 
  user: { id: user._id, firstName: user.firstName, lastName: user.lastName, name: user.name, email: user.email, phone: user.phone, isAdmin: !!user.isAdmin }, 
  message: "Login successful" 
});
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error logging in" });
  }
};

// ========================
// ADMIN FUNCTIONS
// ========================

// Fetch all users (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, { firstName: 1, lastName: 1, name: 1, email: 1, phone: 1, _id: 1 }); // include name parts and _id
    res.json({ success: true, data: users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching users" });
  }
};

// Add new user (admin)
const createUserByAdmin = async (req, res) => {
  const { firstName, lastName, name, email, password, phone } = req.body;
  const finalName = name || ((firstName || lastName) ? `${firstName || ''} ${lastName || ''}`.trim() : '');
  try {
    const exists = await userModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new userModel({ firstName, lastName, name: finalName, email, phone, password: hashedPassword });
    await newUser.save();

    // Return created user data (admin flow)
    res.json({ success: true, message: "User added", data: { id: newUser._id, firstName: newUser.firstName, lastName: newUser.lastName, name: newUser.name, email: newUser.email, phone: newUser.phone } });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding user" });
  }
};

// Delete user (admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting user" });
  }
};

// Update user (admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
  const { firstName, lastName, name, email, password, phone } = req.body;

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // If an image file was uploaded via multer, store its filename
    if (req.file && req.file.filename) {
      updateData.image = req.file.filename;
      // attempt to remove previous image file to avoid orphaned files
      try {
        const existing = await userModel.findById(id).select('image');
        if (existing && existing.image) {
          const fs = await import('fs');
          fs.unlink(`uploads/${existing.image}`, () => {});
        }
      } catch (e) {
        // ignore failures to delete
      }
    }

    const updated = await userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User updated successfully", data: updated });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating user" });
  }
};

// ========================
// EXPORTS
// ========================
export { registerUser, loginUser, getAllUsers, createUserByAdmin, deleteUser, updateUser };

// Reset password by email without a token (dev convenience)
const resetPasswordNoCode = async (req, res) => {
  try {
    // Only allow this in non-production or when explicitly enabled
    const allow = process.env.ALLOW_PASSWORD_RESET_NO_CODE === 'true' || process.env.NODE_ENV !== 'production';
    if (!allow) return res.json({ success: false, message: 'Not allowed in this environment' });

    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // create token and return minimal user data for auto-login
    const token = jwt.sign({ id: user._id, isAdmin: !!user.isAdmin }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
    res.json({ success: true, message: 'Password reset', token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, name: user.name, email: user.email, phone: user.phone, isAdmin: !!user.isAdmin } });
  } catch (err) {
    console.error('resetPasswordNoCode error:', err);
    res.json({ success: false, message: 'Error resetting password' });
  }
};

export { resetPasswordNoCode };

// ========================
// PASSWORD RESET
// ========================

// Request a password reset - creates a token and (in production) would email it.
import nodemailer from 'nodemailer';

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: 'Email required' });
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    // Prepare transporter - prefer real SMTP from env, fallback to ethereal for dev
    let transporter;
    let usingEthereal = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      console.log('Password reset: using configured SMTP host', process.env.SMTP_HOST);
    } else {
      // create ethereal test account for dev
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      usingEthereal = true;
      console.log('Password reset: using Ethereal test account for email preview');
    }

    const from = process.env.FROM_EMAIL || 'no-reply@example.com';
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOpts = {
      from,
      to: user.email,
      subject: 'Password reset code',
      text: `You requested a password reset. Use the following code to reset your password: ${token}\n\nIf you didn't request this, ignore this email.`,
      html: `<p>You requested a password reset. Use the following code to reset your password:</p><pre style="background:#f4f4f4;padding:10px;border-radius:4px">${token}</pre><p>If you didn't request this, ignore this email.</p>`
    };

    // Try sending with the configured transporter. If it fails (e.g. SMTP auth),
    // fall back to Ethereal so devs can still receive a preview URL.
    let info;
    let preview;
    try {
      info = await transporter.sendMail(mailOpts);
    } catch (sendErr) {
      console.error('Error sending email with configured transporter:', sendErr && sendErr.message ? sendErr.message : sendErr);
      // If we already were using Ethereal, rethrow
      if (usingEthereal) throw sendErr;

      // Attempt Ethereal fallback for development convenience
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        usingEthereal = true;
        console.warn('Falling back to Ethereal for password reset email (dev).');
        info = await transporter.sendMail(mailOpts);
      } catch (etherealErr) {
        console.error('Ethereal fallback also failed:', etherealErr && etherealErr.message ? etherealErr.message : etherealErr);
        throw etherealErr; // will be caught by outer catch
      }
    }

    // For ethereal/dev preview, log the preview URL for convenience
    if (usingEthereal && nodemailer.getTestMessageUrl && info) {
      preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('Preview URL for reset email:', preview);
    }

    const resp = { success: true, message: 'Reset token created and emailed if the account exists' };
    if (preview) resp.previewUrl = preview;
    if (usingEthereal && !process.env.SMTP_HOST) resp.message += ' (dev preview)';
    res.json(resp);
  } catch (err) {
    // In normal operation do not leak internal errors to the client.
    // When DEBUG_EMAIL is set, return the error message to help debugging.
    const debug = process.env.DEBUG_EMAIL === 'true';
    if (debug) {
      console.error('ForgotPassword error (debug):', err);
      return res.json({ success: false, message: err.message || 'Error creating reset token', stack: err.stack });
    }
    console.error('ForgotPassword error:', err && err.message ? err.message : err);
    res.json({ success: false, message: 'Error creating reset token' });
  }
};

// Reset password using token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) return res.json({ success: false, message: 'Token and password required' });
    const user = await userModel.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.json({ success: false, message: 'Token invalid or expired' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error resetting password' });
  }
};

export { forgotPassword, resetPassword };

// Promote user to admin (dev helper)
const promoteUser = async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
    const expected = process.env.ADMIN_PROMOTE_KEY || 'dev_promote_key';
    if (adminKey !== expected) return res.json({ success: false, message: 'Unauthorized' });

    const { email } = req.body;
    if (!email) return res.json({ success: false, message: 'Email required' });

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: 'User not found' });

    user.isAdmin = true;
    await user.save();

    res.json({ success: true, message: 'User promoted to admin' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error promoting user' });
  }
};

export { promoteUser };

// Debug: list users (protected by admin promote key)
const listUsersDebug = async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    const expected = process.env.ADMIN_PROMOTE_KEY || 'dev_promote_key';
    if (adminKey !== expected) return res.json({ success: false, message: 'Unauthorized' });

    const users = await userModel.find({}, { password: 0 });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error listing users' });
  }
};

export { listUsersDebug };
