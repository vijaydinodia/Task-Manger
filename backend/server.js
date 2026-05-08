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
  .connect(
    "mongodb+srv://vijaydinodia548_db_user:MJlBT2ezPZY8b2iA@cluster0.hsnuqv1.mongodb.net/",
  )
  .then(() => console.log("Db is connected"))
  .catch((err) => console.log("Db is not connected, ", err.message));

const port = 5000;

app.use("/user", userRoute);
app.use("/task", taskRoute);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
  startDailyTaskSummaryScheduler();
});
