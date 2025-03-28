require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;

// Fetch Users
app.get("/users", async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/users`);
        const usersArray = response.data.users;

        // Convert users array to object with IDs as keys
        const users = {};
        usersArray.forEach(user => {
            users[user.id] = user.name;
        });

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Fetch Top/Latest Posts
app.get("/posts", async (req, res) => {
    try {
        const type = req.query.type; // latest or popular
        if (!type || (type !== "latest" && type !== "popular")) {
            return res.status(400).json({ error: "Invalid type parameter" });
        }

        const response = await axios.get(`${BASE_URL}/posts`);
        let posts = response.data.posts;

        if (type === "latest") {
            posts = posts
                .filter(post => post.timestamp) // Ensure timestamp exists
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);
        } else {
            const maxComments = Math.max(...posts.map(p => p.comments ? p.comments.length : 0));
            posts = posts.filter(p => p.comments && p.comments.length === maxComments);
        }

        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
