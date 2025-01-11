const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong, try again later' });
};

module.exports = errorHandlerMiddleware;
