const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGO_DB_URL;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("tutorflow-db");
    const tutorCollection = db.collection("tutor");

    app.get("/available-tutor", async (req, res) => {
      const result = await tutorCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get("/tutor", async (req, res) => {
      const result = await tutorCollection.find().toArray();
      res.send(result);
    });

    app.get("/tutor/:id", async (req, res) => {
      const { id } = req.params;

      const result = await tutorCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/add-tutor", async (req, res) => {
      const tutorData = req.body;

      const result = await tutorCollection.insertOne(tutorData);

      res.send(result);
    });

    app.get("/my-tutors/:email", async (req, res) => {
      const email = req.params.email;

      const result = await tutorCollection.find({ userEmail: email }).toArray();

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Form Server!");
});

app.listen(port, () => {
  console.log(`Server on running on ${port}`);
});
