const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const port = 3000;
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUrl = `mongodb+srv://${process.env.MONGO_UN}:${process.env.MONGO_PW}@cluster0.hfvvz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(mongoUrl);
const dbName = "SDE-ToDoList";

client.connect().then(() => {
  const db = client.db(dbName);

  const todoList = db.collection("todolist");

  app.get("/todo", async (req, res) => {
    const complete = req.query.complete;
    const userId = req.query.userId

    const data = await todoList.find({ complete: complete, userId: userId }).toArray();
    res.send(data);
  });

  app.post("/todo", (req, res) => {
    const { item, complete, dueDate, userId } = req.body;

    if (!item || item.length === 0 || !complete || complete.length === 0 || !userId || userId.length === 0) {
      return res
        .status(400)
        .json({ message: "Need both item and complete status" });
    }

    const todo = { item, complete, userId };

    if (dueDate && dueDate.length !== 0) {
      todo.dueDate = dueDate;
    } else {
      todo.dueDate = "No date selected";
    }

    todoList.insertOne(todo).then(() => {
      res.redirect(303, `/todo?complete=false&userId=${userId}`);
    });
  });

  app.put("/todo", async (req, res) => {
    const { _id, itemName, dueDate, complete, userId } = req.body;

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

    todoList.updateOne({ _id: ObjectId(_id) }, { $set: newTodo }).then(() => {
      res.redirect(303, `/todo?complete=false&userId=${userId}`);
    });
  });

  app.delete("/todo", async (req, res) => {
    const { _id, userId } = req.body;

    itemToDelete = await todoList.find({_id: ObjectId(_id)}).toArray();
   
    if(itemToDelete[0].complete === "false"){
      todoList.deleteOne({ _id: ObjectId(_id) }).then(() => {
            res.redirect(303, `/todo?complete=false&userId=${userId}`);
          });
    } else {
      todoList.deleteOne({ _id: ObjectId(_id) }).then(() => {
        res.redirect(303, `/todo?complete=true&userId=${userId}`);
      });
    }

    
  });

  app.listen(process.env.PORT || port, () => {
    console.log("Listening on port 3000");
  });
});
