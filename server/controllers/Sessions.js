const Questions = require("../constants/Questions");
const { generateUniqueId } = require("../utils/utils");
const SessionModel = require('../models/Session');

exports.session = (req, res) => {
    //start session if it doesn't exist
    if (!req.session.sessionId) {
        //generate unique
        req.session.sessionId = generateUniqueId();
        req.session.currentQuestionIndex = 0;
        //store responses
        req.session.responses = [];
        //set start time of session
        req.session.startTime = Date.now();
        res.status(201).json(req.session);
    } else {
        res.status(409).json("Session is already created")
    }
}

exports.question = (req, res) => {
    //if session is not exist
    if (!req.session.sessionId) return res.status(404).json({ message: 'Session not found' });
    //return current question and index
    const currentQuestion = Questions[req.session.currentQuestionIndex]
    res.status(200).json({ question: currentQuestion, questionIndex: req.session.currentQuestionIndex });
}

exports.answer = async (req, res) => {
    const { answer } = req.body;
    //if session is not exist
    if (!req.session.sessionId) return res.status(404).json({ message: 'Session not found' });
    //get current question
    const question = Questions[req.session.currentQuestionIndex];
    //push user and bots messages to responses
    req.session.responses.push({ "bot": question, "user": answer });
    //increase index to next question
    req.session.currentQuestionIndex++;

    try {
        //search existing session
        const existingSession = await SessionModel.findOne({ sessionId: req.session.sessionId });
        //if session is not created on mongo
        if (!existingSession) {
            //create new session on mongo and save it
            const newSessionData = new SessionModel({
                sessionId: req.session.sessionId,
                responses: req.session.responses,
                startTime: req.session.startTime
            });
            
            await newSessionData.save();
            //return next question
            const nextQuestion = Questions[req.session.currentQuestionIndex];
            return res.status(200).json({ question: nextQuestion, questionIndex: req.session.currentQuestionIndex });
        }
        //if session is created on mongo and bot still have questions to answer
        if (req.session.currentQuestionIndex < Questions.length) {
            //update the responses on mongo
            existingSession.responses = req.session.responses;
            await existingSession.save();
            //return next question
            const nextQuestion = Questions[req.session.currentQuestionIndex];
            return res.status(200).json({ question: nextQuestion, questionIndex: req.session.currentQuestionIndex });
        }
        //if session is created on mongo and questions is finished
        existingSession.responses = req.session.responses;
        //set session end time and save 
        existingSession.endTime = Date.now();
        await existingSession.save();

        res.status(200).json({ message: 'Session completed', sessionId: req.session.sessionId, sessionEnded: true });
        //destroy session
        req.session.destroy();

    } catch (error) {
        res.status(500).json({ message: 'Error saving session data', error: error.message });
    }
};


exports.getChatHistory = async (req, res) => {
    if (req.session.sessionId) {
        //get only responses from session model and return them
        const results = await SessionModel.find({sessionId:req.session.sessionId}, { responses: 1 })
        res.status(200).json(results)
    } else {
        res.status(404).json({ message: 'Session not found' })
    }
}

exports.complete = (req, res) => {
    // Check session exists
    if (!req.session || !req.session.sessionId) {
        return res.status(404).json({ message: 'Session not found' });
    }

    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Session could not be completed' });
        res.status(200).json({ message: 'Session completed' });
    });
}