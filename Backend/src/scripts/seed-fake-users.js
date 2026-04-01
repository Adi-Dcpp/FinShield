import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../db/index.db.js";
import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";

dotenv.config();

const fakeUsers = [
  {
    name: "Adi",
    email: "bt24ec025@nitmz.ac.in",
    usualDevices: ["dev-bt24ec025-01"],
    homeCountry: "IN",
  },
  {
    name: "gaurav",
    email: "kgaurav3257@gmail.com",
    usualDevices: ["dev-kgaurav-01", "dev-kgaurav-02"],
    homeCountry: "IN",
  },
  {
    name: "abhijeet",
    email: "bt24ec014@nitmz.ac.in",
    usualDevices: ["dev-bt24ec014-01"],
    homeCountry: "IN",
  },
  {
    name: "Aarav Sharma",
    email: "aarav.sharma+finshield@example.com",
    usualDevices: ["dev-aa-01"],
    homeCountry: "IN",
  },
  {
    name: "Priya Verma",
    email: "priya.verma+finshield@example.com",
    usualDevices: ["dev-pv-01", "dev-pv-02"],
    homeCountry: "IN",
  },
  {
    name: "Rohan Mehta",
    email: "rohan.mehta+finshield@example.com",
    usualDevices: ["dev-rm-01"],
    homeCountry: "IN",
  },
  {
    name: "Neha Kapoor",
    email: "neha.kapoor+finshield@example.com",
    usualDevices: ["dev-nk-01", "dev-nk-02"],
    homeCountry: "IN",
  },
  {
    name: "Ishaan Gupta",
    email: "ishaan.gupta+finshield@example.com",
    usualDevices: ["dev-ig-01"],
    homeCountry: "IN",
  },
  {
    name: "Sanya Iyer",
    email: "sanya.iyer+finshield@example.com",
    usualDevices: ["dev-si-01", "dev-si-02"],
    homeCountry: "IN",
  },
  {
    name: "Kunal Singh",
    email: "kunal.singh+finshield@example.com",
    usualDevices: ["dev-ks-01"],
    homeCountry: "IN",
  },
  {
    name: "Meera Nair",
    email: "meera.nair+finshield@example.com",
    usualDevices: ["dev-mn-01"],
    homeCountry: "IN",
  },
  {
    name: "Arjun Rao",
    email: "arjun.rao+finshield@example.com",
    usualDevices: ["dev-ar-01", "dev-ar-02"],
    homeCountry: "IN",
  },
  {
    name: "Kavya Menon",
    email: "kavya.menon+finshield@example.com",
    usualDevices: ["dev-km-01"],
    homeCountry: "IN",
  },
];

const MERCHANTS = [
  "Amazon",
  "Flipkart",
  "Uber",
  "Swiggy",
  "Paytm Wallet",
  "Binance",
  "Myntra",
  "BookMyShow",
];

const riskToDecision = (riskPoint) => {
  if (riskPoint >= 70) return "HIGH_RISK";
  if (riskPoint >= 35) return "MEDIUM_RISK";
  return "LOW_RISK";
};

const buildTransactionsForUser = (userDoc, userIndex) => {
  const transactions = [];

  for (let txIndex = 0; txIndex < 8; txIndex += 1) {
    const amount = 700 + userIndex * 250 + txIndex * 180;
    const geoCountry = txIndex % 5 === 0 ? "SG" : userDoc.homeCountry;
    const deviceId =
      txIndex % 4 === 0
        ? `${userDoc.usualDevices[0]}-new-${txIndex}`
        : userDoc.usualDevices[txIndex % userDoc.usualDevices.length];
    const riskPoint = Math.min(100, 18 + userIndex * 3 + txIndex * 11);
    const decision = riskToDecision(riskPoint);
    const status = riskPoint >= 70 ? "FAILED" : "SUCCESS";
    const riskFactors = [];

    if (riskPoint >= 70) riskFactors.push("HIGH_RISK_SCORE");
    if (geoCountry !== userDoc.homeCountry) riskFactors.push("GEO_MISMATCH");
    if (deviceId.includes("-new-")) riskFactors.push("NEW_DEVICE");

    transactions.push({
      userId: userDoc._id,
      amount,
      deviceId,
      geoCountry,
      merchant: MERCHANTS[(userIndex + txIndex) % MERCHANTS.length],
      timestamp: new Date(Date.now() - (userIndex * 8 + txIndex) * 60 * 60 * 1000),
      riskPoint,
      riskFactors,
      decision,
      status,
    });
  }

  return transactions;
};

const seedFakeUsers = async () => {
  try {
    await connectDB();

    const userUpserts = fakeUsers.map((user) => ({
      updateOne: {
        filter: { email: user.email },
        update: {
          $set: {
            name: user.name,
            email: user.email,
            usualDevices: user.usualDevices,
            homeCountry: user.homeCountry,
          },
        },
        upsert: true,
      },
    }));

    const userResult = await User.bulkWrite(userUpserts);

    const seededUsers = await User.find({
      email: { $in: fakeUsers.map((u) => u.email) },
    });

    if (seededUsers.length !== fakeUsers.length) {
      throw new Error(
        `Expected ${fakeUsers.length} users, found ${seededUsers.length} after upsert`
      );
    }

    const seededUserIds = seededUsers.map((u) => u._id);

    const deletedTransactions = await Transaction.deleteMany({
      userId: { $in: seededUserIds },
    });

    const allTransactions = seededUsers.flatMap((userDoc, userIndex) =>
      buildTransactionsForUser(userDoc, userIndex)
    );

    const insertedTransactions = await Transaction.insertMany(allTransactions, {
      ordered: true,
    });

    const userStatOps = seededUsers.map((userDoc) => {
      const successfulTransactions = insertedTransactions.filter(
        (tx) => String(tx.userId) === String(userDoc._id) && tx.status === "SUCCESS"
      );
      const totalAmount = successfulTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const txnCount = successfulTransactions.length;
      const avgTxnAmount = txnCount > 0 ? totalAmount / txnCount : 0;

      return {
        updateOne: {
          filter: { _id: userDoc._id },
          update: {
            $set: {
              txnCount,
              avgTxnAmount,
            },
          },
        },
      };
    });

    await User.bulkWrite(userStatOps);

    const total = await User.countDocuments({
      email: { $in: fakeUsers.map((u) => u.email) },
    });

    console.log("Seed complete");
    console.log(`Users inserted: ${userResult.upsertedCount}`);
    console.log(`Users updated: ${userResult.modifiedCount}`);
    console.log(`Users matched: ${userResult.matchedCount}`);
    console.log(`Transactions deleted (old seed): ${deletedTransactions.deletedCount}`);
    console.log(`Transactions inserted: ${insertedTransactions.length}`);
    console.log(`Total seeded fake users present: ${total}`);
  } catch (error) {
    console.error("Failed to seed fake users:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedFakeUsers();


// node src/scripts/seed-fake-users.js