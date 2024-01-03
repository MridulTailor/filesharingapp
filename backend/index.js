const express = require("express");
const cors = require("cors");
const connectToMongo = require("./config/db");

const app = express();

const PORT = process.env.PORT || 3001;

//connect to db
connectToMongo();

// Enable CORS for a specific origin
const corsOptions = {
  origin: "http://localhost:3000", // Adjust to your React app's URL
  optionsSuccessStatus: 200, // Some legacy browsers choke on a 204, so use 200
};
app.use(cors(corsOptions));

//routes
app.use("/api/files", require("./routes/files"));
app.use("/files", require("./routes/show"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
