const express = require('express');
const { json } = require('body-parser');
const app = express();
const router = express.Router();
const uuid = require('uuid');
const port = process.env.PORT || 3000;

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://u21513768:Quintin12@cluster0.tk9adsj.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let collection;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('BACKEND-TEST');
    collection = db.collection('users');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

connectToMongoDB();

// GET all users
router.get('/get-user', async (req, res) => {
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Access the "users" database and "Backend_Intern" collection
    const collection = client.db("users").collection("Backend_Intern");

    // Find all users
    const users = await collection.find().toArray();

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
});

router.get('/get-user/:username', async (req, res) => {
  const username = req.params.username;

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Access the "users" database and "Backend_Intern" collection
    const collection = client.db("users").collection("Backend_Intern");

    // Find the user with the matching username
    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
});

// POST a new user
router.post('/add-user', async (req, res) => {
  try {
    const newUser = req.body;
    if (!newUser || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role) {
      console.log("Fields empty or incomplete");
      return res.status(500).json({ error: 'Fields empty or incomplete.' });
    }

    let client;

    try {
      // Create a new MongoClient
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });

      // Connect to the MongoDB cluster
      await client.connect();

      // Access the "users" database and "Backend_Intern" collection
      const collection = client.db("users").collection("Backend_Intern");

      // Generate username and ID
      newUser.username = await generateUsername(newUser);

      // Generate username and ID
      newUser.id = uuid.v4();

      // Insert the new user into the collection
      await collection.insertOne(newUser);

      res.json(newUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Close the MongoDB client connection
      await client.close();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Generate username function
async function generateUsername(newUser) {
  const firstName = newUser.firstName;
  const lastName = newUser.lastName;
  let username = "";
  username += firstName.substring(0, 3).toLowerCase();
  console.log("first Name: " + firstName);
  console.log("last Name: " + lastName);

  const vowels = ["a", "e", "i", "o", "u"];

  let counter = 0;

  for (let letter of lastName.toLowerCase()) {
    if (!vowels.includes(letter) && counter < 3) {
      username += letter.toLowerCase();
      counter++;
    } else if (counter < 3) {
      break;
    }
  }

  if (counter < 3) {
    while (counter < 3) {
      username += 'x';
      counter++;
    }
  }

  let occurrence = 1;

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Access the "users" database and "Backend_Intern" collection
    const collection = client.db("users").collection("Backend_Intern");

    // Query the database to find users with matching usernames
    const regex = new RegExp('^' + username, 'i');
    const result = await collection.find({ username: regex }).toArray();

    // Find the maximum occurrence for the matching usernames
    const maxOccurrence = result.reduce((max, user) => {
      const userOccurrence = parseInt(user.username.substring(6, 9));
      return userOccurrence > max ? userOccurrence : max;
    }, 0);

    occurrence = maxOccurrence + 1;
  } catch (err) {
    console.error(err);
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }

  username += String(occurrence).padStart(3, '0');
  return username;
}

// PUT updates a specific user based on username
router.put('/edit-user', async (req, res) => {
  try {
    const editUser = req.body;

    if (!editUser || !editUser.firstName || !editUser.lastName || !editUser.email || !editUser.role || !editUser.username || !editUser.id) {
      console.log("Fields empty or incomplete");
      return res.status(500).json({ error: 'Fields empty or incomplete.' });
    }

    // Connect to the MongoDB cluster
    await client.connect();

    // Access the "users" database and "Backend_Intern" collection
    const collection = client.db("users").collection("Backend_Intern");

    // Find the user to update
    const filter = { username: editUser.username, id: editUser.id };
    const update = { $set: editUser };
    const options = { returnOriginal: false };
    const result = await collection.findOneAndUpdate(filter, update, options);

    if (!result.value) {
      return res.json({ error: 'User not found.' });
    }

    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
});

// DELETE a specific user based on username
router.delete('/delete-user/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Connect to the MongoDB cluster
    await client.connect();

    // Access the "users" database and "Backend_Intern" collection
    const collection = client.db("users").collection("Backend_Intern");

    // Delete the user
    const result = await collection.findOneAndDelete({ username });

    if (!result.value) {
      return res.json({ error: 'User not found.' });
    }

    console.log("user successfully deleted\n");
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
});

app.use(json());
app.use('/', router); // Important!

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
