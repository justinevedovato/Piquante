const rateLimit = require("express-rate-limit");

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

module.exports = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: "Too many login attempts, please try again later",
});
