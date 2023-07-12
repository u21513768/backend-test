const express = require('express');
const { json } = require('body-parser');
//const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
//const filePath = path.join(process.cwd(), 'functions', 'data.json');
const port = process.env.PORT || 3000; 

const { MongoClient, ServerApiVersion } = require('mongodb');
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




/*router.get('/get-user', (req, res) => {
    try {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: err });
        }
    
        returnData = JSON.parse(data);
        res.send(returnData);
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  //GET a user based on the username of the user
  router.get('/get-user/:username', (req, res) => {
    const username = req.params.username;
  
    try {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to read JSON file.' });
        }
  
        const result = JSON.parse(data);
  
        console.log(result[0].username);
        const returnUser = result.find(user => user.username === username);
          if (!returnUser) {
            return res.status(404).json({ error: 'User not found.' });
          }
  
          res.json(returnUser);
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });*/
  
  //POST a new user to the JSON.
  /*router.post('/add-user', (req, res) => {
    const newUser = JSON.parse(req.body);

    if (!newUser ||!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role)
    {
      console.log("Fields empty or incomplete");
      return res.status(500).json({ error: 'Fields empty or incomplete.' });
    }
  
    try {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to read JSON file.' });
        }
  
          const users = JSON.parse(data) || [];
          newUser.username = generateUsername(newUser, users);
          console.log("New username is: " + newUser.username);
          newUser.id = uuid.v4();
          users.push(newUser);
  
          fs.writeFile(filePath, JSON.stringify(users), 'utf8', (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Failed to write JSON file.' });
            }
  
          res.json(users);
        });
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });*/
  
  // Create username function
  /*function generateUsername(newUser, users) {
    firstName = newUser.firstName;
    lastName = newUser.lastName;
    username = "";
    username += firstName.substring(0, 3).toLowerCase();
    console.log("first Name: " + firstName);
    console.log("last Name: " + lastName);
  
    const vowels = ["a", "e", "i", "o", "u"];
  
    let counter = 0
  
    for (let letter of lastName.toLowerCase()) 
    {
      if (!vowels.includes(letter) && counter < 3) 
      {
        username += letter.toLowerCase();
        counter++;
      }
      else if (counter < 3)
      {
        break;
      }
    }
  
    if (counter < 3)
    {
      while (counter < 3)
      {
        username += 'x';
        counter++;
      }
    }
  
    let occurrence = 1;
    for (let user of users)
    {
      let userToCheck = user.username.toLowerCase();
      if (userToCheck.includes(username.toLowerCase()) && parseInt(user.username.substring(6, 9)) >= occurrence)
      {
        occurrence = parseInt(user.username.substring(6, 9)) + 1
      }
    }
  
    username += String(occurrence).padStart(3, '0');
    suffix.padEnd(3, 'x');
    return username;
  }*/
  
  //PUT updates a specific user based on username
  /*router.put('/edit-user', (req, res) => {
    const editUser = JSON.parse(req.body);
  
    if (!editUser || !editUser.firstName || !editUser.lastName || !editUser.email || !editUser.role || !editUser.username || !editUser.id)
    {
      console.log("Fields empty or incomplete");
      return res.status(500).json({ error: 'Fields empty or incomplete.' });
    }
  
    try {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to read JSON file.' });
        }
  
        const result = JSON.parse(data);
          // Update the question and answer tags based on priority
        const userIndex = result.findIndex(user => user.username.toLowerCase() === editUser.username.toLowerCase() && user.id.toLowerCase() === editUser.id.toLowerCase());
      
        if (userIndex != -1) {
          result.splice(userIndex, 1);
          //console.log(result);
        }
        else
        {
          console.error(err);
          return res.json({ error: 'User not found.' });
        }
  
        result.push(editUser)
  
        fs.writeFile(filePath, JSON.stringify(result), 'utf8', (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to write JSON file.' });
          }
  
        res.json(result);
  
        });
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // DELETE a specific user based on username
  router.delete('/delete-user/:username', (req, res) => {
    const username = req.params.username;
  
    try {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to read JSON file.' });
        }
  
        const result = JSON.parse(data);
          // Update the question and answer tags based on priority
        const userIndex = result.findIndex(user => user.username.toLowerCase() === username);
      
        if (userIndex != -1) {
          result.splice(userIndex, 1);
          //console.log(result);
        }
        else
        {
          console.error(err);
          return res.json({ error: 'User not found.' });
        }
  
        fs.writeFile(filePath, JSON.stringify(result), 'utf8', (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to write JSON file.' });
          }
  
        res.json(result);
  
        });
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });*/
  

app.use(json());
app.use('/.netlify/functions/server', router); // Important!

app.listen(port, () => { 
    console.log(`Server is running on port ${port}`);
  });

module.exports = app;
//module.exports.handler = serverless(app);
