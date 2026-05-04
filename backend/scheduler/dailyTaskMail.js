const Task = require("../model/taskModel");
const User = require("../model/userModel");
const transporter = require("../transporter");

const REPORT_HOUR = 17;
const REPORT_MINUTE = 0;
const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || "Asia/Kolkata";

const getTimeParts = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  return parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
};

const buildTaskSummaryHtml = ({ name, pending, progress, completed }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
    <h2>Daily Task Summary</h2>
    <p>Hello ${name},</p>
    <p>Here is your task summary for today:</p>
    <table style="border-collapse:collapse;min-width:320px">
      <tr>
        <td style="border:1px solid #e5e7eb;padding:10px;font-weight:bold;color:#991b1b">Pending</td>
        <td style="border:1px solid #e5e7eb;padding:10px">${pending}</td>
      </tr>
      <tr>
        <td style="border:1px solid #e5e7eb;padding:10px;font-weight:bold;color:#854d0e">Progress</td>
        <td style="border:1px solid #e5e7eb;padding:10px">${progress}</td>
      </tr>
      <tr>
        <td style="border:1px solid #e5e7eb;padding:10px;font-weight:bold;color:#166534">Completed</td>
        <td style="border:1px solid #e5e7eb;padding:10px">${completed}</td>
      </tr>
    </table>
  </div>
`;

const countUserTasksByStatus = async (userId, status) =>
  Task.countDocuments({
    status,
    $or: [{ assignedTo: userId }, { createdBy: userId }],
  });

const sendDailyTaskSummaryEmails = async () => {
  const users = await User.find({ status: "active" }).select("name email");

  for (const user of users) {
    const [pending, progress, completed] = await Promise.all([
      countUserTasksByStatus(user._id, "pending"),
      countUserTasksByStatus(user._id, "progress"),
      countUserTasksByStatus(user._id, "completed"),
    ]);

    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Daily Task Summary",
      html: buildTaskSummaryHtml({
        name: user.name,
        pending,
        progress,
        completed,
      }),
    });
  }

  console.log(`Daily task summaries sent to ${users.length} users`);
};

const startDailyTaskSummaryScheduler = () => {
  let lastRunDate = "";

  setInterval(async () => {
    const parts = getTimeParts();
    const currentDate = `${parts.year}-${parts.month}-${parts.day}`;
    const currentHour = Number(parts.hour);
    const currentMinute = Number(parts.minute);

    if (
      currentHour !== REPORT_HOUR ||
      currentMinute !== REPORT_MINUTE ||
      lastRunDate === currentDate
    ) {
      return;
    }

    lastRunDate = currentDate;

    try {
      await sendDailyTaskSummaryEmails();
    } catch (error) {
      console.log("Daily task summary mail failed:", error.message);
    }
  }, 60 * 1000);

  console.log(`Daily task summary scheduler started for 5:00 PM ${REPORT_TIMEZONE}`);
};

module.exports = {
  sendDailyTaskSummaryEmails,
  startDailyTaskSummaryScheduler,
};
