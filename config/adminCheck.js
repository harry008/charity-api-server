export default function adminCheck(req, res, next) {
  const user = req.currentUser;
  if (!user.profile.isAdmin) {
    return res.status(403).json({
      error: true,
      message: 'You are not allowed here!'
    });
  }
  next();
}
