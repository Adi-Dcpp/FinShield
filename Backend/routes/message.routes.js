const express = require("express");
const router = express.Router();

const {checkMessageController} = require("../controller/message.controller");

router.post("/check", checkMessageController);

module.exports = router;