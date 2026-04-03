// messageAnalyzer.service.js

import axios from "axios";

const FRIEND_API_URL =
    process.env.FRIEND_API_URL || "http://localhost:8000/analyze";


export const analyzeMessage = async (text) => {
    let friendResult = null;

    try {
        const response = await axios.post(
            FRIEND_API_URL,
            { text },
        );

        if(response) {
            friendResult = response
        }
    } catch (err) {
        console.error("Friend API failed:", err.message);
    }

    return friendResult;
};