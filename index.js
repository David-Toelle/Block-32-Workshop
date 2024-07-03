const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres:123@localhost:5432/the_acme_iceCreamShop"
);
const app = express();
const path = require("path");
// Middleware to parse JSON request bodies
app.use(express.json());


app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching flavors:", err.message);
    res.status(500).json({ error: "Error fetching flavors" });
  }
});

app.get("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query("SELECT * FROM flavors WHERE id = $1", [
      id,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: `Flavor with id ${id} not found` });
    }
  } catch (err) {
    console.error(`Error fetching flavor with id ${id}:`, err.message);
    res.status(500).json({ error: `Error fetching flavor with id ${id}` });
  }
});

app.post("/api/flavors", async (req, res) => {
  const { name, is_favorite } = req.body;
  try {
    const result = await client.query(
      "INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *",
      [name, is_favorite]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating flavor:", err.message);
    res.status(500).json({ error: "Error creating flavor" });
  }
});

// PUT update a flavor by id
app.put("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  const { name, is_favorite } = req.body;
  try {
    const result = await client.query(
      "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = now() WHERE id = $3 RETURNING *",
      [name, is_favorite, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: `Flavor with id ${id} not found` });
    }
  } catch (err) {
    console.error(`Error updating flavor with id ${id}:`, err.message);
    res.status(500).json({ error: `Error updating flavor with id ${id}` });
  }
});

// DELETE delete a flavor by id
app.delete("/api/flavors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await client.query("DELETE FROM flavors WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    console.error(`Error deleting flavor with id ${id}:`, err.message);
    res.status(500).json({ error: `Error deleting flavor with id ${id}` });
  }
});

const init = async () => {
  try {
    await client.connect();
    console.log("connected to database");
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS flavors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
    await client.query(createTableQuery);
    console.log("tables created");
    // const insertDataQuery = `
    //     INSERT INTO flavors (name, is_favorite) VALUES
    //       ('vanilla', false),
    //       ('cherry', true),
    //       ('Chocolate', true);
    //   `;

    // await client.query(insertDataQuery);

    console.log("data seeded");
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Error setting up the server:", err.message);
  }  
};


init();
