require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB } = require('./db');
const taskRoutes = require('./routes/taskRoutes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('DB connection failed', e);
    process.exit(1);
  });
