const User = require("../model/userModel");
const Task = require("../model/taskModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../transporter");
const moment = require("moment");

const saltRounds = 10;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createdAccountTemplate = ({ name, email, password }) => {
  const safeName = escapeHtml(name || "there");
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173/login";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Task Manager Account Created</title>
      </head>
      <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;overflow:hidden;border-radius:18px;background:#ffffff;box-shadow:0 18px 45px rgba(15,23,42,0.12);">
                <tr>
                  <td style="background:#4f46e5;padding:28px 32px;color:#ffffff;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Task Manager</p>
                    <h1 style="margin:0;font-size:28px;line-height:1.25;">Your account is ready</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                      An admin has created your Task Manager account. Use the credentials below to sign in and start managing your assigned tasks.
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 26px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;">
                      <tr>
                        <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;">Email</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${safeEmail}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 20px;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;">Temporary password</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${safePassword}</p>
                        </td>
                      </tr>
                    </table>

                    <a href="${escapeHtml(loginUrl)}" style="display:inline-block;border-radius:10px;background:#4f46e5;padding:13px 20px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Login to Task Manager
                    </a>

                    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#475569;">
                      For your security, please change this password from your profile after your first login.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding:18px 32px;background:#f8fafc;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
                      If you were not expecting this account, please contact your Task Manager admin.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

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
       subject: "🎉 Welcome to Task Manager - Account Created Successfully",
       html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Task Manager</h1>
          <p style="margin-top: 5px;">Your Account Is Ready 🚀</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; color: #333;">
          <h2>Hello ${newUser.name}, 👋</h2>

          <p>
            Welcome to <strong>Task Manager</strong>! Your account has been created successfully.
          </p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4f46e5;">Account Details</h3>

            <p><strong>Email:</strong> ${newUser.email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>

          <p>
            You can now log in and start managing your daily tasks efficiently.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="http://localhost:5173/login"
              style="
                background: #4f46e5;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                display: inline-block;
              "
            >
              Login Now
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If you did not create this account, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 13px; color: #777;">
          © ${new Date().getFullYear()} Task Manager. All rights reserved.
        </div>

      </div>
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

// reset password after otp verification
exports.resetForgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isOtpVerified) {
      return res.status(403).json({ message: "Please verify OTP before resetting password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.isOtpVerified = false;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
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
