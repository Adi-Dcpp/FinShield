import Transaction from "../models/transaction.model.js";

const getTxnCountLast10Min = async (userId) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const count = await Transaction.countDocuments({
      userId,
      createdAt: { $gte: tenMinutesAgo },
    });

    return count;
  } catch (error) {
    console.error("Txn count error:", error.message);
    return null; 
  }
};

const getLast20Transactions = async (userId) => {
  try {
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return transactions;
  } catch (error) {
    console.error("Fetch transactions error:", error.message);
    return null;
  }
};

const createTransaction = async ({
  userId,
  transaction,
  riskPoint,
  riskFactors,
  decision,
  status,
}) => {
  try {
    const newTxn = await Transaction.create({
      userId,
      amount: transaction.amount,
      deviceId: transaction.deviceId,
      geoCountry: transaction.geoCountry,
      merchant: transaction.merchant,
      timestamp: transaction.timestamp || new Date(),

      riskPoint,
      riskFactors,
      decision,
      status,   
    });

    return newTxn;
  } catch (error) {
    console.error("Create transaction error:", error.message);
    return null;
  }
};


export {
  getLast20Transactions,
  getTxnCountLast10Min,
  createTransaction,
};