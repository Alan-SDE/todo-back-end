const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { auth, requiresAuth } = require('express-openid-connect');
const port = 3000;
const app = express();
require('dotenv').config();
const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: process.env.BASEURL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER,
  secret: process.env.SECRET
};

app.use(cors());
app.use(auth(config));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUrl =
  `mongodb+srv://${process.env.MONGO_UN}:${process.env.MONGO_PW}@cluster0.hfvvz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(mongoUrl);
const dbName = "SDE-ToDoList";


client.connect().then(() => {
    const db = client.db(dbName);
  
    const todoList = db.collection("todolist");

    app.get('/', (req, res) => {
      res.redirect(`https://alanpottinger.com/todo-front-end/?user=${req.oidc.user}`);
      
    });
    
    app.get('/profile', (req, res) => {
      res.send(JSON.stringify(req.oidc.user));
    });
  
    app.get("/todo", async (req, res) => {
        const complete = req.query.complete;

      const data = await todoList.find({complete: complete}).toArray();
      res.send(data);
    });
  
    app.post("/todo", (req, res) => {
      const { item, complete, dueDate } = req.body;
  
      if (!item || item.length === 0 || !complete || complete.length === 0) {
        return res.status(400).json({ message: "Need both item and complete status" });
      }
  
      const todo = { item, complete };
  
      if (dueDate && dueDate.length !== 0) {
        todo.dueDate = dueDate;
      } else {
          todo.dueDate = "No date selected"
      }
  
      todoList.insertOne(todo).then(() => {
        res.redirect(303, "/todo?complete=false");
      });
    });
  
    app.put("/todo", async (req, res) => {
      const { _id, itemName, dueDate , complete} = req.body;
  
      const newTodo = {};
  
      if (itemName && itemName.length !== 0) {
        newTodo.item = itemName;
      }
  
      if (dueDate && dueDate.length !== 0) {
        newTodo.dueDate = dueDate;
      }

      if (complete && complete.length !== 0) {
        newTodo.complete = complete;
      }

      todoList
        .updateOne({ _id: ObjectId(_id) }, { $set: newTodo })
        .then(() => {
          res.redirect(303, "/todo?complete=false");
        });
    });
  
    app.delete("/todo/:id", (req, res) => {
      const Id = req.params.id;
  
      todoList.deleteOne({ _id: ObjectId(Id) }).then(() => {
        res.redirect(303, "/todo?complete=false");
      });
    });
  
    app.listen(process.env.PORT || port, () => {
      console.log("Listening on port 3000");
    });
  });
  