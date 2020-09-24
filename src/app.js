require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config')
const winston = require('winston');
const { v4: uuid } = require('uuid');

const app = express();

const logger = winston.createLogger({
  level: 'info', 
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  // move to the next middleware
  next()
})

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const bookmarks = [
  { id: uuid(),
    title: 'Thinkful',
    url: 'https://www.thinkful.com',
    description: 'Think outside the classroom',
    rating: 5 },
  { id: uuid(),
    title: 'Google',
    url: 'https://www.google.com',
    description: 'Where we find everything else',
    rating: 4 },
  { id: uuid(),
    title: 'MDN',
    url: 'https://developer.mozilla.org',
    description: 'The only place to find web documentation',
    rating: 5 },
]



const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get('/bookmarks', (req, res) => {
  res
    .json(bookmarks);
})

app.get('/bookmarks/:id', (req, res) =>  {
  const { id } = req.params;
  const bookmark = bookmarks.find(bookmark => bookmark.id == id);

  if (!bookmark) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Card Not Found');
}

app.post('/bookmarks', (req, res) => {
  const { header, bookmarkId=[] } = req.body;

  if (!header) {
    logger.error('Header is required');
    return res
      .status(400)
      .send('Invalid data');
  }

  if (bookmarkId.length > 0) {
    let valid = true;
    cardIds.forEach(bookmarkId => {
      const bookmark = bookmarks.find(bookmark => bookmark.id == bookmarkId);
      if (!bookmark) {
        logger.error(`Card with id ${bookmarkId} not found in cards array.`);
        valid = false;
      }
    })

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data')
    }
  }

  const id = uuid();
  const newBookmark = {
    id, 
    header,
    bookmarkId
  };

  bookmarks.push(newBookmark);
  logger.info(`List with id ${id} created`);
  res
    .status(201)
    .location(`http://localhost:8000/bookmarks/${id}`)
    .json({id})
})

  res.json(bookmark)
})

app.use(function errorHandler(error, req, res, next) {
   let response
   if (NODE_ENV === 'production') {
     response = { error: { message: 'server error' } }
   } else {
     console.error(error)
     response = { message: error.message, error }
   }
   res.status(500).json(response)
 })

module.exports = app