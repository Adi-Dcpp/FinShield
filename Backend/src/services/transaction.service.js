import Transaction from "../models/transaction.model.js";

const getTxnCountLast10Min = async (userId) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const count = await Transaction.countDocuments({
    userId,
    createdAt: { $gte: tenMinutesAgo },
  });

  return count;
};

const getLast20Transactions = async (userId) => {
  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })  
    .limit(20);

  return transactions;
};

const createTransaction = async ({
  userId,
  transaction,
  riskPoint,
  riskFactors,
  decision
}) => {
  const newTxn = await Transaction.create({
    userId,
    amount: transaction.amount,
    deviceId: transaction.deviceId,
    geoCountry: transaction.geoCountry,
    merchant: transaction.merchant,
    timestamp: transaction.timestamp || new Date(),
    riskPoint,
    riskFactors,
    decision
  });

  return newTxn;
};

export {
    getLast20Transactions,
    getTxnCountLast10Min,
    createTransaction,
}
