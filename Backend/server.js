require("dotenv").config();

const express = require("express");
const messageRoutes = require("./routes/message.routes.js");
const connectDB = require("./configure/database");
connectDB();

const app= express();
app.use(express.json());

app.use("/api/v1/messages", messageRoutes);

app.get("/", (req,res)=>{
    res.send("Server is running");
});

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
});