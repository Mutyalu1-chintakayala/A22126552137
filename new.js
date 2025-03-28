const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb'); // Fixed incorrect import

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

// Function to fetch numbers from a third-party API (simulated)
async function fetchNumbersFromThirdPartyApi(numberId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id: numberId, value: Math.random() * 100 });
        }, 500);
    });
}

// Function to store numbers in MongoDB
async function storeNumbers(numbers) {
    try {
        const db = client.db('averageCalculator');
        const collection = db.collection('numbers');

        const existingDoc = await collection.findOne({ id: numbers.id });

        if (!existingDoc) {
            const result = await collection.insertOne(numbers);
            console.log('Inserted new number:', result.insertedId);
        } else {
            await collection.updateOne({ id: numbers.id }, { $set: { value: numbers.value } });
            console.log('Updated existing number:', numbers);
        }
    } catch (error) {
        console.error('Error storing numbers:', error);
    }
}

// Function to calculate the average of a sliding window
function calculateAverage(numbers, windowSize) {
    if (numbers.length === 0) return 0;

    const windowStartIndex = Math.max(0, numbers.length - windowSize);
    const windowNumbers = numbers.slice(windowStartIndex);
    const sum = windowNumbers.reduce((acc, num) => acc + num, 0);

    return sum / Math.min(windowNumbers.length, windowSize);
}

// Route to get a number and calculate its moving average
app.get('/number/:numberId', async (req, res) => {
    try {
        let { numberId } = req.params;
        numberId = parseInt(numberId);

        if (isNaN(numberId)) {
            return res.status(400).json({ error: 'Invalid number id' });
        }

        // Fetch number from third-party API
        const numberData = await fetchNumbersFromThirdPartyApi(numberId);

        // Store the number in MongoDB
        await storeNumbers(numberData);

        // Fetch all stored numbers to calculate average
        const db = client.db('averageCalculator');
        const collection = db.collection('numbers');
        const allNumbers = await collection.find().toArray();
        const numberValues = allNumbers.map(doc => doc.value);

        const windowSize = 5; // Example window size
        const avg = calculateAverage(numberValues, windowSize);

        res.json({ average: avg });
    } catch (error) {
        console.error('Error fetching or storing numbers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
async function startServer() {
    try {
        await connectToDatabase();
        app.listen(3000, () => {
            console.log('Average calculator service is running on http://localhost:3000');
        });
    } catch (error) {
        console.error('Error starting the server:', error);
    }
}

startServer();
