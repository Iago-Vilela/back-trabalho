const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// Connect to PostgreSQL
const client = new Client(config.urlConnection);
client.connect((err) => {
  if (err) {
    console.error("Failed to connect to the database.", err);
    process.exit(1);
  } else {
    console.log("Connected to PostgreSQL database.");
  }
});

// Routes

// GET /tasks - Retrieve all tasks
app.get("/tasks", async (req, res) => {
    try {
      const result = await client.query("SELECT * FROM tasks");
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch tasks.", details: err.message });
    }
  });
  

// GET /tasks/:id - Retrieve a single task by ID
app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;
  client.query("SELECT * FROM tasks WHERE id = $1", [id], (err, result) => {
    if (err) {
      console.error("Error retrieving task:", err);
      res.status(500).json({ error: "Failed to retrieve task." });
    } else if (result.rows.length === 0) {
      res.status(404).json({ error: "Task not found." });
    } else {
      res.status(200).json(result.rows[0]);
    }
  });
});

// POST /tasks - Create a new task
app.post('/tasks', async (req, res) => {
  const { title, description, due_date, status } = req.body;
  try {
    const newTask = await client.query(
      'INSERT INTO tasks (title, description, due_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, due_date, status || 'pending']
    );
    res.status(201).json(newTask.rows[0]); // Return the created task
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update a task by ID
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, status } = req.body;
  client.query(
    "UPDATE tasks SET title = $1, description = $2, due_date = $3, status = $4 WHERE id = $5 RETURNING *",
    [title, description, due_date, status, id],
    (err, result) => {
      if (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Failed to update task." });
      } else if (result.rowCount === 0) {
        res.status(404).json({ error: "Task not found." });
      } else {
        res.status(200).json(result.rows[0]);
      }
    }
  );
});

// DELETE /tasks/:id - Delete a task by ID
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  client.query("DELETE FROM tasks WHERE id = $1", [id], (err, result) => {
    if (err) {
      console.error("Error deleting task:", err);
      res.status(500).json({ error: "Failed to delete task." });
    } else if (result.rowCount === 0) {
      res.status(404).json({ error: "Task not found." });
    } else {
      res.status(200).json({ message: `Task with ID ${id} deleted.` });
    }
  });
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

module.exports = app;
