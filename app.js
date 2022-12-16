const express = require("express");
const router = require("./router");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});
app.use("/api", router);
app.use(express.static('static'));
module.exports = app;