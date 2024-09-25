const generateUniqueId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9);
};


module.exports= {
    generateUniqueId
}