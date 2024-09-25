const Questions = require("../constants/Questions");
const { generateUniqueId } = require("../utils/utils");
const SessionModel = require('../models/Session');

exports.session = (req, res) => {
    if (!req.session.sessionId) {
        req.session.sessionId = generateUniqueId();
        req.session.currentQuestionIndex = 0;
        req.session.responses = [];
        req.session.startTime = Date.now();
        res.status(201).json(req.session);
    } else {
        res.status(201).json("Session Zaten Var")
    }
}

exports.question = (req, res) => {
    if (!req.session.sessionId) return res.status(201).json({ message: 'Session not found' });
    const currentQuestion = Questions[req.session.currentQuestionIndex]
    res.status(200).json({ question: currentQuestion, questionIndex: req.session.currentQuestionIndex });
}

exports.answer = async (req, res) => {
    const { answer } = req.body;

    if (!req.session.sessionId) return res.status(404).json({ message: 'Session not found' });
    const question = Questions[req.session.currentQuestionIndex];
    req.session.responses.push({ "bot": question, "user": answer });
    req.session.currentQuestionIndex++;

    try {
        const existingSession = await SessionModel.findOne({ sessionId: req.session.sessionId });

        if (!existingSession) {
            const newSessionData = new SessionModel({
                sessionId: req.session.sessionId,
                responses: req.session.responses,
                startTime: req.session.startTime
            });
            
            await newSessionData.save();
            const nextQuestion = Questions[req.session.currentQuestionIndex];
            return res.status(200).json({ question: nextQuestion, questionIndex: req.session.currentQuestionIndex });
        }

        if (req.session.currentQuestionIndex < Questions.length) {
            existingSession.responses = req.session.responses;
            await existingSession.save();
            const nextQuestion = Questions[req.session.currentQuestionIndex];
            return res.status(200).json({ question: nextQuestion, questionIndex: req.session.currentQuestionIndex });
        }

        existingSession.responses = req.session.responses;
        existingSession.endTime = Date.now();
        await existingSession.save();

        res.status(200).json({ message: 'Session completed', sessionId: req.session.sessionId });
        req.session.destroy();

    } catch (error) {
        res.status(500).json({ message: 'Error saving session data', error: error.message });
    }
};


exports.getChatHistory = async (req, res) => {
    if (req.session.sessionId) {
        const results = await SessionModel.find({sessionId:req.session.sessionId}, { responses: 1 })
        res.status(200).json(results)
    } else {
        res.status(200).json({ message: 'Session not found' })
    }
}

exports.complete = (req, res) => {
    // Oturumun var olup olmadığını kontrol et
    if (!req.session || !req.session.sessionId) {
        return res.status(404).json({ message: 'Session not found' });
    }

    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Session could not be completed' });
        res.status(200).json({ message: 'Session completed' });
    });
}