const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);

    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // await client.connect();

    const db = client.db("tutorflow-db");
    const tutorCollection = db.collection("tutor");
    const bookingCollection = db.collection("bookings");

    app.get("/available-tutor", async (req, res) => {
      const result = await tutorCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get("/tutor", async (req, res) => {
      const { searchParams, startDate, endDate } = req.query;

      let query = {};

      if (searchParams) {
        query.tutorName = {
          $regex: searchParams,
          $options: "i",
        };
      }

      if (startDate && endDate) {
        query.sessionStartDate = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      const result = await tutorCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/tutor/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const result = await tutorCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/add-tutor", verifyToken, async (req, res) => {
      const tutorData = {
        ...req.body,
        hourlyFee: Number(req.body.hourlyFee),
        totalSlot: Number(req.body.totalSlot),
      };

      const result = await tutorCollection.insertOne(tutorData);

      res.send(result);
    });

    app.get("/my-tutors/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      const result = await tutorCollection.find({ userEmail: email }).toArray();

      res.send(result);
    });

    app.patch("/update-tutor/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const updatedData = req.body;

      const result = await tutorCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updatedData,
        },
      );

      res.send(result);
    });

    app.delete("/delete-tutor/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const result = await tutorCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    app.post("/book-session", verifyToken, async (req, res) => {
      const booking = req.body;

      if (!ObjectId.isValid(booking.tutorId)) {
        return res.send({
          message: "Invalid Tutor ID",
        });
      }

      const tutor = await tutorCollection.findOne({
        _id: new ObjectId(booking.tutorId),
      });

      if (!tutor) {
        return res.send({ message: "Tutor not found" });
      }

      if (tutor.totalSlot <= 0) {
        return res.send({
          message: "No available slots left, This session is fully booked.",
        });
      }

      const today = new Date();
      const sessionDate = new Date(tutor.sessionStartDate);

      if (today < sessionDate) {
        return res.send({
          message: "Booking is not available yet for this tutor",
        });
      }

      const result = await bookingCollection.insertOne(booking);

      await tutorCollection.updateOne(
        { _id: new ObjectId(booking.tutorId) },
        { $inc: { totalSlot: -1 } },
      );

      res.send(result);
    });

    app.get("/my-bookings/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      const result = await bookingCollection
        .find({ studentEmail: email })
        .toArray();

      res.send(result);
    });

    app.patch("/cancel-booking/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "cancelled" } },
      );

      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
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
