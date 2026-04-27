module.exports = function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    req.isAdmin = true;
  } else {
    req.isAdmin = false;
  }
  next();
};