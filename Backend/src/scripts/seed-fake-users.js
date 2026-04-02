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
    usualDevices: ["motorola edge 50 fusion"],
    homeCountry: "IN",
  },
  {
    name: "Gaurav",
    email: "bt24ec022@nitmz.ac.in",
    usualDevices: ["pixel 8-a"],
    homeCountry: "IN",
  },
  {
    name: "Abhijeet",
    email: "bt24ec014@nitmz.ac.in",
    usualDevices: ["motorola"],
    homeCountry: "IN",
  },
  {
    name: "Chandan",
    email: "bt24ec003@nitmz.ac.in",
    usualDevices: ["samsung"],
    homeCountry: "IN",
  },
  {
    name: "Aarav Sharma",
    email: "bt24ec025+2@nitmz.ac.in",
    usualDevices: ["dev-aa-01", "dev-aa-02", "dev-aa-03"],
    homeCountry: "IN",
  },
  {
    name: "Priya Verma",
    email: "bt24ec022+2@nitmz.ac.in",
    usualDevices: ["dev-pv-01", "dev-pv-02"],
    homeCountry: "IN",
  },
  {
    name: "Rohan Mehta",
    email: "bt24ec014+2@nitmz.ac.in",
    usualDevices: ["dev-rm-01", "dev-rm-02"],
    homeCountry: "IN",
  },
  {
    name: "Neha Kapoor",
    email: "bt24ec003+2@nitmz.ac.in",
    usualDevices: ["dev-nk-01", "dev-nk-02"],
    homeCountry: "IN",
  },
  {
    name: "Ishaan Gupta",
    email: "bt24ec025+3@nitmz.ac.in",
    usualDevices: ["dev-ig-01", "dev-ig-02", "dev-ig-03"],
    homeCountry: "IN",
  },
  {
    name: "Sanya Iyer",
    email: "bt24ec022+3@nitmz.ac.in",
    usualDevices: ["dev-si-01", "dev-si-02"],
    homeCountry: "IN",
  },
  {
    name: "Kunal Singh",
    email: "bt24ec014+3@nitmz.ac.in",
    usualDevices: ["dev-ks-01"],
    homeCountry: "IN",
  },
  {
    name: "Meera Nair",
    email: "bt24ec003+3@nitmz.ac.in",
    usualDevices: ["dev-mn-01", "dev-mn-02", "dev-mn-03"],
    homeCountry: "IN",
  },
  {
    name: "Arjun Rao",
    email: "bt24ec025+4@nitmz.ac.in",
    usualDevices: ["dev-ar-01", "dev-ar-02"],
    homeCountry: "IN",
  },
  {
    name: "Kavya Menon",
    email: "bt24ec022+4@nitmz.ac.in",
    usualDevices: ["dev-km-01", "dev-km-02"],
    homeCountry: "IN",
  },
  {
    name: "Divya Reddy",
    email: "bt24ec014+4@nitmz.ac.in",
    usualDevices: ["dev-dr-01", "dev-dr-02"],
    homeCountry: "IN",
  },
];

const MERCHANTS = [
  "Amazon", "Flipkart", "Uber", "Swiggy", "Paytm Wallet", "Binance", "Myntra", "BookMyShow",
  "Netflix", "Spotify", "YouTube Premium", "Starbucks", "Dominos", "Zomato", "OYO Rooms",
  "IRCTC", "Ixigo", "GoIbibo", "Booking.com", "Makemytrip", "FitPro Gym", "Curefit",
  "Unacademy", "Udemy", "Apple", "Microsoft", "Google Play", "Steam", "Playstation Network", "Xbox Live",
];

const riskToDecision = (riskPoint) => {
  if (riskPoint >= 70) return "HIGH_RISK";
  if (riskPoint >= 35) return "MEDIUM_RISK";
  return "LOW_RISK";
};

const buildTransactionsForUser = (userDoc, userIndex) => {
  const transactions = [];
  const transactionCount = 50;

  for (let txIndex = 0; txIndex < transactionCount; txIndex += 1) {
    let amount;
    const amountPattern = txIndex % 10;
    if (amountPattern === 0) amount = Math.floor(Math.random() * 500) + 100;
    else if (amountPattern === 1) amount = Math.floor(Math.random() * 2000) + 1000;
    else if (amountPattern === 2) amount = Math.floor(Math.random() * 5000) + 5000;
    else if (amountPattern === 3) amount = Math.floor(Math.random() * 100000) + 50000;
    else amount = 700 + userIndex * 250 + txIndex * 180;

    const geoPattern = txIndex % 12;
    let geoCountry;
    if (geoPattern === 0) geoCountry = "US";
    else if (geoPattern === 1) geoCountry = "SG";
    else if (geoPattern === 2) geoCountry = "UK";
    else if (geoPattern === 3) geoCountry = "AE";
    else if (geoPattern === 4) geoCountry = "JP";
    else geoCountry = userDoc.homeCountry;

    const devicePattern = txIndex % 8;
    let deviceId;
    if (devicePattern === 0) {
      deviceId = `${userDoc.usualDevices[0]}-new-${txIndex}-suspicious`;
    } else if (devicePattern === 1) {
      deviceId = `${userDoc.usualDevices[0]}-vpn-${txIndex}`;
    } else {
      deviceId = userDoc.usualDevices[txIndex % userDoc.usualDevices.length];
    }

    let riskPoint;
    const riskPattern = txIndex % 7;
    if (riskPattern === 0) riskPoint = Math.floor(Math.random() * 35);
    else if (riskPattern === 1) riskPoint = Math.floor(Math.random() * 40) + 35;
    else if (riskPattern === 2) riskPoint = Math.floor(Math.random() * 30) + 70;
    else if (riskPattern === 3) riskPoint = 95;
    else riskPoint = Math.min(100, 18 + userIndex * 2 + txIndex * 1);

    const decision = riskToDecision(riskPoint);
    const status = riskPoint >= 70 ? (Math.random() > 0.3 ? "FAILED" : "SUCCESS") : "SUCCESS";
    const riskFactors = [];

    if (riskPoint >= 70) riskFactors.push("HIGH_RISK_SCORE");
    if (geoCountry !== userDoc.homeCountry) riskFactors.push("GEO_MISMATCH");
    if (deviceId.includes("-new-")) riskFactors.push("NEW_DEVICE");
    if (deviceId.includes("-vpn-")) riskFactors.push("VPN_DETECTED");
    if (amount > 50000) riskFactors.push("LARGE_AMOUNT");
    if (txIndex > 0 && amount > 100000 && transactions[txIndex - 1].amount > 100000)
      riskFactors.push("RAPID_HIGH_VALUE_TXN");

    const daysAgo = Math.floor(Math.random() * 90);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);

    transactions.push({
      userId: userDoc._id,
      amount,
      deviceId,
      geoCountry,
      merchant: MERCHANTS[(userIndex * 17 + txIndex * 7) % MERCHANTS.length],
      timestamp,
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

    const deletedTransactions = await Transaction.deleteMany({});
    const deletedUsers = await User.deleteMany({});

    const insertedUsers = await User.insertMany(fakeUsers, { ordered: true });

    if (insertedUsers.length !== fakeUsers.length) {
      throw new Error(`Expected ${fakeUsers.length} users, inserted ${insertedUsers.length}`);
    }

    const allTransactions = insertedUsers.flatMap((userDoc, userIndex) =>
      buildTransactionsForUser(userDoc, userIndex)
    );

    const insertedTransactions = await Transaction.insertMany(allTransactions, {
      ordered: true,
    });

    const userStatOps = insertedUsers.map((userDoc) => {
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

    const total = await User.countDocuments({});

    console.log("Seed complete");
    console.log(`Users deleted (old data): ${deletedUsers.deletedCount}`);
    console.log(`Transactions deleted (old data): ${deletedTransactions.deletedCount}`);
    console.log(`Users inserted: ${insertedUsers.length}`);
    console.log(`Transactions inserted: ${insertedTransactions.length}`);
    console.log(`Total users present after seed: ${total}`);
  } catch (error) {
    console.error("Failed to seed fake users:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedFakeUsers();

// node src/scripts/seed-fake-users.js
