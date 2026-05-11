const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const userRoute = require("./routes/userRoute");
const taskRoute = require("./routes/taskRoute");
const {
  startDailyTaskSummaryScheduler,
} = require("./scheduler/dailyTaskMail");


mongoose
  .connect("mongodb://localhost:27017/taskmanger")
  .then(() => console.log("Db is connected"))
  .catch((err) => console.log("Db is not connected, ", err.message));

const port = 5000;

app.use("/user", userRoute);
app.use("/task", taskRoute);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
  startDailyTaskSummaryScheduler();
});
