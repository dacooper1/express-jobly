"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    console.log(res.locals)
    if (!res.locals.user) throw new UnauthorizedError("Must be logged in");
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when admin access is reequired.
 *
 * If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals || !res.locals.user || !res.locals.user.isAdmin) {
      throw new UnauthorizedError("Admin access required");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when admin access is reequired.
 *
 * If not, raises Unauthorized.
 */

function ensureCorrectUser(req, res, next) {
  try {
    // Check if no user is logged in
    if (!res.locals || !res.locals.user) {
      throw new UnauthorizedError("No user logged in");
    }

    // Allow access if user is admin
    if (res.locals.user.isAdmin) {
      return next();
    }

    // Allow access if the logged-in user matches the requested username
    if (res.locals.user.username === req.params.username) {
      return next();
    }

    // If neither admin nor correct user, throw an error
    throw new UnauthorizedError("Unauthorized");
  } catch (err) {
    return next(err);
  }
}




module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin, 
  ensureCorrectUser
};
