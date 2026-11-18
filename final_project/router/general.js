const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "Customer successfully registered. Now you can login" });
});

// Task 1: Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const allBooks = await Promise.resolve(books);
    return res.status(200).type('json').send(JSON.stringify(allBooks, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books." });
  }
});

// Task 2: Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject({ status: 404, message: `Book with ISBN ${isbn} not found.` });
    }
  })
    .then((book) => res.status(200).type('json').send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Task 3: Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const matchingBooks = await new Promise((resolve, reject) => {
      const results = [];
      const keys = Object.keys(books);
      for (const key of keys) {
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
          results.push({
            isbn: key,
            author: books[key].author,
            title: books[key].title,
            reviews: books[key].reviews
          });
        }
      }
      if (results.length > 0) {
        resolve(results);
      } else {
        reject({ status: 404, message: `No books found by author '${author}'.` });
      }
    });
    return res.status(200).type('json').send(JSON.stringify({ booksbyauthor: matchingBooks }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Task 4: Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    const matchingBooks = await new Promise((resolve, reject) => {
      const results = [];
      const keys = Object.keys(books);
      for (const key of keys) {
        if (books[key].title.toLowerCase() === title.toLowerCase()) {
          results.push({
            isbn: key,
            author: books[key].author,
            title: books[key].title,
            reviews: books[key].reviews
          });
        }
      }
      if (results.length > 0) {
        resolve(results);
      } else {
        reject({ status: 404, message: `No books found with title '${title}'.` });
      }
    });
    return res.status(200).type('json').send(JSON.stringify({ booksbytitle: matchingBooks }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Task 5: Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).type('json').send(JSON.stringify(books[isbn].reviews, null, 4));
  }
  return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
});

// ============================================================================
// Async/Await & Promise Client Methods using Axios (Tasks 10 - 13)
// ============================================================================

// Task 10: Get the list of all books available in the shop using Async/Await with Axios
async function getAllBooks(callback) {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    if (typeof callback === 'function') {
      callback(null, response.data);
    }
    return response.data;
  } catch (error) {
    if (typeof callback === 'function') {
      callback(error, null);
    }
    throw error;
  }
}

// Task 11: Get book details based on ISBN using Promises with Axios
function getBookByISBN(isbn) {
  return new Promise((resolve, reject) => {
    axios
      .get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
  });
}

// Task 12: Get book details based on Author using Async/Await with Axios
async function getBooksByAuthor(author) {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Task 13: Get book details based on Title using Promises with Axios
function getBooksByTitle(title) {
  return new Promise((resolve, reject) => {
    axios
      .get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
  });
}

// Allow running the 4 Axios methods directly with: node router/general.js
if (require.main === module) {
  (async () => {
    try {
      console.log("--- Task 10: Get All Books (Async/Await + Axios) ---");
      const allBooks = await getAllBooks();
      console.log(JSON.stringify(allBooks, null, 2));

      console.log("\n--- Task 11: Get Book by ISBN (Promises + Axios) ---");
      const bookByIsbn = await getBookByISBN(1);
      console.log(JSON.stringify(bookByIsbn, null, 2));

      console.log("\n--- Task 12: Get Books by Author (Async/Await + Axios) ---");
      const booksByAuthor = await getBooksByAuthor("Chinua Achebe");
      console.log(JSON.stringify(booksByAuthor, null, 2));

      console.log("\n--- Task 13: Get Books by Title (Promises + Axios) ---");
      const booksByTitle = await getBooksByTitle("Things Fall Apart");
      console.log(JSON.stringify(booksByTitle, null, 2));
    } catch (err) {
      console.error("Axios request failed:", err.message);
      process.exitCode = 1;
    }
  })();
}

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
