const express = require('express');
const app = express();

const fileUpload = require('express-fileupload')
const dotenv = require("dotenv");
const routes = require("./routes/main")
const mongoose = require('mongoose')


dotenv.config();

mongoose.connect(
    process.env.DB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log('connected to db!')
);


app.use(fileUpload())
app.use('/', routes)



const port = 5500;
app.listen(port, () => console.log('Server is running on port: ' + port));
