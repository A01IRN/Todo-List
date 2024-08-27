const mongoose = require("mongoose");
require('dotenv').config();
let mongoURL = process.env.mongo_uri
mongoose.connect(mongoURL)
let database = mongoose.connection

module.exports = database