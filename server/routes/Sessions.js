const express = require("express");
const { question, session, answer, complete, getChatHistory } = require("../controllers/Sessions"); // Fonksiyonları doğru şekilde import et
const router = express.Router();

router.post("/", session);
router.get("/question", question);
router.post("/answer", answer);
router.post("/complete", complete);
router.get("/getChatHistory",getChatHistory);

module.exports = router
