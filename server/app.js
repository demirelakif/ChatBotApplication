const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  credentials: true,
  origin: 'http://localhost:3000', // İstemci URL
}

app.use(cors(corsOptions))
app.use(bodyParser.json());

mongoose.connect(process.env.DATABASE_URL, {})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  cookie:{
    httpOnly:true,
    maxAge: 1000 * 60 * 60,
    secure:false
  },
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL })
}));



const SessionRoutes = require('./routes/Sessions');
app.use("/api/sessions",SessionRoutes)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => {
    console.log(`ChatBot app listening on port ${PORT}`)
})