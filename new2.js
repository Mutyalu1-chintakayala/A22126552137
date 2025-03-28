const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 5000;
const WINDOW_SIZE = 10;
const windowNumbers = [];

const API_URLS = {
    "p": "https://thirdparty.com/api/primes",
    "f": "https://thirdparty.com/api/fibonacci",
    "e": "https://thirdparty.com/api/even",
    "r": "https://thirdparty.com/api/random"
};

// Function to fetch number from third-party API with 500ms timeout
const fetchNumber = async (numberId) => {
    if (!API_URLS[numberId]) return null;

    try {
        const response = await axios.get(API_URLS[numberId], { timeout: 500 });
        return response.data.number; 
    } catch (error) {
        return null;
    }
};

// API Endpoint
app.get("/numbers/:numberId", async (req, res) => {
    const numberId = req.params.numberId;
    const prevState = [...windowNumbers];

    const newNumber = await fetchNumber(numberId);
    
    if (newNumber !== null && !windowNumbers.includes(newNumber)) {
        if (windowNumbers.length >= WINDOW_SIZE) {
            windowNumbers.shift(); 
        }
        windowNumbers.push(newNumber);
    }

    const currState = [...windowNumbers];
    const avg = currState.length > 0 ? (currState.reduce((a, b) => a + b, 0) / currState.length).toFixed(2) : 0;

    res.json({
        windowPrevState: prevState,
        windowCurrState: currState,
        numbers: newNumber !== null ? [newNumber] : [],
        avg: parseFloat(avg)
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
