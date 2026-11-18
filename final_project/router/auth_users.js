const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Returns true if username is a non-empty string and not already taken
  if (typeof username !== 'string' || username.trim().length === 0) {
    return false;
  }
  return !users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  // Returns true if username and password match a registered user
  return users.some((user) => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in: username and password are required." });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign(
      { data: password },
      'access',
      { expiresIn: 60 * 60 }
    );

    req.session.authorization = {
      accessToken,
      username
    };

    return res.status(200).json({ message: "Customer successfully logged in" });
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review || (req.body && req.body.review);
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  if (!review) {
    return res.status(400).json({ message: "Review content is required." });
  }

  const isUpdate = Boolean(books[isbn].reviews[username]);
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: isUpdate
      ? `The review for the book with ISBN ${isbn} has been updated.`
      : `The review for the book with ISBN ${isbn} has been added.`,
    reviews: books[isbn].reviews
  });
});

// Delete a book review (logged-in users can delete only their own reviews)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review found for user ${username} on book with ISBN ${isbn}.` });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
