import express from 'express';
import multer from 'multer';
import { resetPasswordNoCode } from '../controllers/userController.js';
import { 
  loginUser, 
  registerUser, 
  getAllUsers, 
  createUserByAdmin, 
  deleteUser, 
  updateUser 
  , promoteUser
  , listUsersDebug
  , forgotPassword
  , resetPassword
} from '../controllers/userController.js';

const userRouter = express.Router();

// setup multer for user image uploads
const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// Auth
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password/:token', resetPassword);
userRouter.post('/reset-password-no-code', resetPasswordNoCode);

// Dev helper to promote a user to admin (requires ADMIN_PROMOTE_KEY)
userRouter.post('/promote', promoteUser);

// Debug route: list users (requires x-admin-key header or ?adminKey=)
userRouter.get('/debug/list', listUsersDebug);

// Admin
userRouter.get("/list", getAllUsers);        // fetch all users
userRouter.post("/", createUserByAdmin);    // add new user
userRouter.put("/:id", upload.single('image'), updateUser);         // update user (accept image)
userRouter.delete("/:id", deleteUser);      // delete user

export default userRouter;
// fetching api