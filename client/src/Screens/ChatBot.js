import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, IconButton, Typography, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBotIcon from '../Assets/chatbot.png';
import UserIcon from '../Assets/user.png';
import ThoughtBaloon from '../Assets/thoughtBaloon.png';
import axios from "axios";
import Cookies from 'js-cookie';


const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endOfMessagesRef = useRef(null);

    const handleSendMessage = async() => {
        //if input message is empty
        if (inputMessage.trim() === '') return;
        //add user's message to messages array
        const newMessage = { sender: 'user', text: inputMessage };
        setMessages([...messages, newMessage]);
        //set input message default
        setInputMessage('');
        //scroll down
        endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth'});
        //bot thinking
        setIsTyping(true);
        //send answer to api and get next question
        const nextQuestion = await AnswerQuestion(inputMessage);
        
        if(nextQuestion){
            setTimeout(() => {
                console.log(nextQuestion)
                //set bots new message
                const botReply = { sender: 'bot', text: nextQuestion };
                setMessages((prevMessages) => [...prevMessages, botReply]);
                //bot thinking stopped
                setIsTyping(false);
            }, 1000);
        }

    };

    const StartSession = async () => {
        //think started
        setIsTyping(true);
        await axios.post('http://localhost:5000/api/sessions', {}, { withCredentials: true })
            .then((response) => {
                console.log(response.data);
                //set cookies
                Cookies.set('sessionId', response.data.sessionId);
                
            })
            .catch((err) => {
                console.error(err);
            });

        //bring first question
        await CheckQuestion()
        //think finished
        setIsTyping(false);
    };

    const CheckQuestion = async () => {
        await axios.get('http://localhost:5000/api/sessions/question', { withCredentials: true })
            .then((response) => {
                console.log(response.data.question)
                //set current question
                const newMessage = { sender: 'bot', text: response.data.question };
                console.log(newMessage);
                setMessages(prevMessages => [...prevMessages, newMessage]);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const AnswerQuestion = async (inputMessage) => {
        try {
            const response = await axios.post('http://localhost:5000/api/sessions/answer', { "answer": inputMessage }, { withCredentials: true });
            console.log(response.data);
            //if questions are completed successfully
            if (response.data.sessionEnded) {
                console.log('Session has ended...');
                //remove the cookies
                Cookies.remove('sessionId');
                //set bots last message
                const newMessage = { sender: 'bot', text: "You answered all questions!" };
                setMessages(prevMessages => [...prevMessages, newMessage]);
                const lastMessage = { sender: 'bot', text: "Welcome to Bolt Insight" };
                setMessages(prevMessages => [...prevMessages, lastMessage]);
                setIsTyping(false);
                
            }
            return response.data.question; 
        } catch (err) {
            console.error(err);
        }
    };

    const getChatHistory = async () => {
        await axios.get('http://localhost:5000/api/sessions/getChatHistory', { withCredentials: true })
            .then((response) => {
                console.log(response.data[0].responses);
                if(response.data[0].responses.length>0){
                    //set messages saved before
                    response.data[0].responses.forEach(el => {
                        let newMessageBot = { sender: 'bot', text: el.bot };
                        setMessages((prevMessages) => [...prevMessages, newMessageBot]);
                        let newMessageUser = { sender: 'user', text: el.user };
                        setMessages((prevMessages) => [...prevMessages, newMessageUser]);
                    }); 
                }
                //bring new question
                CheckQuestion();
                
            })
            .catch((err) => {
                console.error(err);
                //for if responses is not saved on mongo
                CheckQuestion();
            });
    };


    useEffect(() => {
        const storedSessionId = Cookies.get('sessionId');
        if (!storedSessionId) {
            StartSession();

        }else{
            getChatHistory();
        }


    },[]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]); // on message state changed

    return (
        <Box sx={{ width: "25vw", margin: '50px auto', border: '3px solid #9e9e9e', borderRadius: 2 }}>
            <Box sx={{ backgroundColor: '#024082', color: '#F6F6F7', p: 2, textAlign: 'center' }}>
                <Typography variant="h6" fontFamily={'monospace'}>Chatbot</Typography>
            </Box>
            <Box sx={{ p: 2, minHeight: "60vh", maxHeight: "60vh", backgroundColor: 'white', overflowY: 'auto' }}>
                {messages.map((message, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                            mb: 1,
                        }}
                    >
                        <Avatar src={message.sender === 'user' ? UserIcon : ChatBotIcon} sx={{ width: 32, height: 32, mb: 0.5 }} />
                        <Typography
                            sx={{
                                backgroundColor: message.sender === 'user' ? ' #424242' : '#1E88E5',
                                color: "#FFFFFF",
                                borderRadius: 16,
                                px: 3,
                                py: 1,
                                maxWidth: '80%',
                                fontFamily: 'monospace',
                            }}
                        >
                            {message.text}
                        </Typography>
                    </Box>
                ))}
                {isTyping && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                        <Box>
                            <Avatar src={ThoughtBaloon} sx={{ width: 32, height: 32, ml: 3 }} />
                            <Avatar src={ChatBotIcon} sx={{ width: 32, height: 32, mt: -1 }} />
                        </Box>


                        {/* <Typography
                            sx={{
                                backgroundColor: '#1E88E5',
                                color: "#FFFFFF",
                                borderRadius: 16,
                                px: 3,
                                py: 1,
                                maxWidth: '75%',
                                fontFamily: 'monospace',
                            }}
                        >
                            ...
                        </Typography> */}
                    </Box>
                )}
                <div ref={endOfMessagesRef} />
            </Box>
            <Box sx={{ display: 'flex', p: 2, bgcolor: "#1E88E5" }}>
                <TextField
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={handleKeyDown}
                    fullWidth
                    style={{ backgroundColor: "#024082", border: "1px solid", borderRadius: "32px", borderColor: "white" }}
                    InputProps={{
                        style: { color: " #BDBDBD", borderRadius: "32px", fontFamily: 'monospace' },
                    }}
                />
                <IconButton style={{ color: "white" }} onClick={handleSendMessage}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default Chatbot;
