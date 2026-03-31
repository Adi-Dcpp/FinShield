import User from "../models/user.model.js";
import { ApiError } from "../utils/api-errors.util.js";
import { ApiResponse } from "../utils/api-response.util.js";
import { updateUserStats } from "../services/user.service.js";
import {
    getLast20Transactions,
    createTransaction,
    getTxnCountLast10Min,
} from "../services/transaction.service.js";
import { getHourFromTime } from "../services/time.service.js";
import { getDecision } from "../services/riskDecision.service.js";
import { calculateRisk } from "../services/riskCalculate.service.js";
import { sendFraudAlertEmail } from "../services/mail.service.js";
import { getCountryFromCity } from "../services/location.service.js";
import { generateExplanation } from "../services/ai.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";

const getReview = asyncHandler(async (req, res) => {
    const { name, amount, deviceId, city, merchant, timeStamp } = req.body;

    if (!name) throw new ApiError(400, "name is required");

    if (
        amount === undefined ||
        deviceId === undefined ||
        !city ||
        !merchant ||
        !timeStamp
    ) {
        throw new ApiError(400, "all fields are required");
    }

    const user = await User.findOne({ name });
    if (!user) throw new ApiError(404, "user not found");

    const geoCountry = await getCountryFromCity(city);
    if (!geoCountry) throw new ApiError(500, "geo service failed");

    const date = new Date(timeStamp);
    if (isNaN(date.getTime())) {
        throw new ApiError(400, "invalid timestamp");
    }
    const hour = getHourFromTime(timeStamp);

    const txnCount10Min = await getTxnCountLast10Min(user._id);
    if (txnCount10Min === null || txnCount10Min === undefined) {
        throw new ApiError(500, "transaction service failed");
    }

    const { riskFactors, riskPoint } = calculateRisk(
        user,
        { amount, geoCountry, deviceId, hour, merchant },
        txnCount10Min,
    );

    const decision = getDecision(riskPoint);

    const explanation = await generateExplanation(riskPoint, riskFactors);
    if (!explanation) throw new ApiError(500, "AI explanation failed");

    let emailAlert = "NOT_TRIGGERED";

    if (riskPoint >= 80) {
        emailAlert = "TRIGGERED";
        try {
            await sendFraudAlertEmail({
                user,
                transaction: {
                    amount,
                    deviceId,
                    geoCountry,
                },
                riskPoint,
            });
            emailAlert = "SENT";
        } catch (err) {
            emailAlert = "FAILED";
            console.error("Email failed:", err.message);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, "review generated", {
            riskPoint,
            riskFactors,
            decision,
            explanation,
            meta: {
                amount,
                deviceId,
                geoCountry,
                hour,
                merchant,
                timestamp: timeStamp,
                emailAlert,
            },
        }),
    );
});

const proceedTransaction = asyncHandler(async (req, res) => {
    const {
        name,
        riskPoint,
        riskFactors,
        meta, // from frontend
    } = req.body;

    if (!name) throw new ApiError(400, "name is required");
    if (!meta || !riskFactors || riskPoint === undefined) {
        throw new ApiError(400, "invalid transaction payload");
    }
    if (meta.amount === undefined || !meta.deviceId || !meta.geoCountry) {
        throw new ApiError(400, "invalid meta data");
    }

    if (typeof riskPoint !== "number" || Number.isNaN(riskPoint)) {
        throw new ApiError(400, "invalid risk score");
    }

    if (riskPoint < 0 || riskPoint > 100) {
        throw new ApiError(400, "invalid risk score");
    }

    const user = await User.findOne({ name });
    if (!user) throw new ApiError(404, "user not found");

    const newTransaction = await createTransaction({
        userId: user._id,
        transaction: meta,
        riskPoint,
        riskFactors,
        decision: getDecision(riskPoint),
        status: "SUCCESS",
    });

    if (!newTransaction) {
        throw new ApiError(500, "failed to save transaction");
    }

    const updatedUser = await updateUserStats(user, {
        amount: meta.amount,
        deviceId: meta.deviceId,
    });

    if (!updatedUser) {
        throw new ApiError(500, "failed to update user stats");
    }

    return res.status(200).json(
        new ApiResponse(200, "transaction successful", {
            newTransaction,
            updatedUser,
        }),
    );
});

const declineTransaction = asyncHandler(async (req, res) => {
    const { name, riskPoint, riskFactors, meta } = req.body;

    if (!name) throw new ApiError(400, "name is required");
    if (!meta || !riskFactors || riskPoint === undefined) {
        throw new ApiError(400, "invalid transaction payload");
    }
    if (meta.amount === undefined || !meta.deviceId || !meta.geoCountry) {
        throw new ApiError(400, "invalid meta data");
    }

    if (typeof riskPoint !== "number" || Number.isNaN(riskPoint)) {
        throw new ApiError(400, "invalid risk score");
    }

    if (riskPoint < 0 || riskPoint > 100) {
        throw new ApiError(400, "invalid risk score");
    }

    const user = await User.findOne({ name });
    if (!user) throw new ApiError(404, "user not found");

    const newTransaction = await createTransaction({
        userId: user._id,
        transaction: meta,
        riskPoint,
        riskFactors,
        decision: getDecision(riskPoint),
        status: "FAILED",
    });

    if (!newTransaction) {
        throw new ApiError(500, "failed to save declined transaction");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "transaction declined", newTransaction));
});

const getHistory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) throw new ApiError(400, "name is required");

    const user = await User.findOne({ name });
    if (!user) throw new ApiError(404, "user not found");

    const transactions = await getLast20Transactions(user._id);
    if (!transactions) {
        throw new ApiError(500, "failed to fetch history");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "history fetched", transactions));
});

export { getReview, proceedTransaction, declineTransaction, getHistory };
