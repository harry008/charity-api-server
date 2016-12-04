import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  let token;

  if (authorizationHeader) {
    token = authorizationHeader.split(' ')[1];
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Failed to authenticate' });
      } else {
        User.findOne({ email: decoded.email.toLowerCase() },
            (err, user) => {
              if (err) {
                res.status(401).json({ error: 'Failed to authenticate' });
              }
              if (!user) {
                res.status(404).json({
                  msg: `Email ${email} not found.`
                });
              } else {
                req.currentUser = user;
                next();
              }
            });
      }
    });
  } else {
    res.status(403).json({
      error: 'No token provided'
    });
  }
};
