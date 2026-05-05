const User = require("../model/userModel");
const Task = require("../model/taskModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../transporter");
const moment = require("moment");

const saltRounds = 10;

//signUp
exports.signUp = async (req, res) => {
  return res.status(403).json({
    message: "Direct signup is disabled. Please contact an admin.",
  });
};

// admin create user
exports.createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashPassword,
      role: "user",
      status: "active",
    });

    try {
      await transporter.sendMail({
        from: `"Task Manager" <${process.env.EMAIL_USER}>`,
        to: newUser.email,
        subject: "Task Manager account created",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2>Welcome to Task Manager</h2>
            <p>Your account has been created by an admin.</p>
            <p><strong>Email:</strong> ${newUser.email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please login and change your password from your profile.</p>
          </div>
        `,
      });
    } catch (mailError) {
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        message: "User was not created because the email could not be sent",
      });
    }

    return res.status(201).json({
      message: "User created and login details emailed",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Your account is inactive" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// forget password
exports.forget = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpire = moment().add(5, "minutes").toDate();
    await user.save();

    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 OTP Verification",
      html: `
        <div style="text-align:center">
          <h2>Your OTP</h2>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// verify otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (moment().isAfter(user.otpExpire)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark verified
    user.otp = null;
    user.otpExpire = null;
    user.isOtpVerified = true;
    await user.save();

    return res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// reset password
exports.resetPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// edit profile
exports.editProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { name } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;

    await user.save();

    return res.status(200).json({
      message: "Profile updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// user status admin only
exports.userStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { email, userId } = req.body;

    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin status cannot be changed" });
    }

    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    return res.status(200).json({
      message: `User is now ${user.status}`,
      status: user.status,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// delete user admin only
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin users cannot be deleted" });
    }

    await Task.deleteMany({
      $or: [{ assignedTo: id }, { createdBy: id }],
    });
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get all user 
exports.getAllUsers = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const searchText = search.trim();
    const query = {};

    if (searchText) {
      const searchRegex = new RegExp(searchText, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { role: searchRegex },
        { status: searchRegex },
      ];
    }

    const users = await User.find(query).select("name email role status");

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// users available for task assignment
exports.getTaskUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "active" }).select("name email role");

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
