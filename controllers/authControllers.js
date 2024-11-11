import bcrypt from "bcryptjs";
import cloudinary from '../public/cloudinary.js';
import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/userModels.js';
import { sendAccountDeletedEmail, sendPasswordChangedEmail, sendPasswordResetRequestEmail, sendVerificationEmail } from "../middleware/verifyEmil.js";


export const personalSignup = async (req, res) => {
  try {
      const { personalName, password, email, country } = req.body;

      if (!personalName || !email || !password || !country) {
          return res.status(400).json({ message: "Please provide all required fields" });
      }

      const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
          return res.status(400).json({
              message: "Password must be at least 8 characters long and contain one special character."
          });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex'); // Generate token

      const newUser = new User({
          personalName,
          password: hashedPassword,
          email,
          country,
          verificationToken,
          isVerified: false
      });

      await newUser.save();
      await sendVerificationEmail(email, personalName, verificationToken);

      return res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error saving user", error: err.message });
  }
};

export const bussinessSignup = async (req, res) => {
    try {
        const { personalName, businessName, role, industry, password, email, country } = req.body;

        if (!personalName || !businessName || !role || !industry || !email || !password || !country) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        const passwordRegex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and must contain one special character."
            });
        }

        const existingUser = await User.findOne({ email });
        console.log(existingUser);

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // const otp = Math.floor(100000 + Math.random() * 900000);

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            personalName,
            password: hashedPassword,
            email,
            country,
            businessName,
            role,
            industry
        });
console.log(newUser);
  
        await newUser.save();
        const verificationToken = crypto.randomBytes(32).toString('hex'); // Generate token

        await sendVerificationEmail(email, businessName, verificationToken);

        return res.status(201).json({ message: "User saved successfully", newUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error saving user", error: err.message });
    }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please input your email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = uuidv4();

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration

    await user.save();

    await sendPasswordResetRequestEmail(email, personalName, token); 

    return res.status(200).json({ message: "Check your email to reset your password" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error saving user", err });
  }
};


  export const resetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword, confirmPassword } = req.body;
  
      if (!token) {
        return res.status(400).json({ message: "Please input your reset token" });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      const user = await User.findOne({
        resetPasswordToken: token
      });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid reset token" });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
  
      await user.save();
      await sendPasswordChangedEmail(email, personalName)
  
      return res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error resetting password", err });
    }
  };

  export const uploadPicture = async (req, res) => {
    try {
    
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const result = await cloudinary.uploader.upload(req.file.path);

        const updatedTrain = await Train.findByIdAndUpdate(
            req.params.id,
            { image: result.secure_url },
            { new: true } 
        );

        return res.status(200).json({
            message: "Picture uploaded successfully",
            data: updatedTrain,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error uploading picture", error: err });
    }
};


  export const deleteUser = async (req, res) => {
    try {
      const { id } = req.query;
  
      const deletedUser = await User.findByIdAndDelete({
        _id: id,
      });
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      };
      
      // await cloudinary.uploader.destroy(deletedUser.image); // Delete the image from cloudinary

      // await sendAccountDeletedEmail(email, personalName);

      res.status(200).json({
        message: "User Deleted Successfully",
        deletedUser,
      });
    } catch (error) {
      res.status(500).json({ error, message: "Error Deleting User" });
    }
  };

  export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        user.isVerified = true;
        user.verificationToken = null; // Clear the token after verification
        await user.save();

        return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Verification failed", error: error.message });
    }
};

// authController.js
export const login = async (req, res) => {
  try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
          return res.status(400).json({ message: "Invalid email or password" });
      }

      if (!user.isVerified) {
          return res.status(403).json({ message: "Please verify your email to log in" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).json({ message: "Invalid email or password" });
      }

      // Generate token and respond with success if needed

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Login failed", error: error.message });
  }
};
