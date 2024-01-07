const express = require("express");
const axios = require("axios");
const { redisClient } = require("./redisClient");
redisClient.on("error", (err) => console.log(err));
const app = express();
const port = 3000;
async function cache(req, res, next) {
  const { username } = req.params;
  try {
    const data = await redisClient.get(username);
    if (data !== null) {
      console.log("present in cache");
      res.send({ reposFromCache: data });
    } else {
      next();
    }
  } catch (error) {
    throw error;
  }
}
async function fetchUserDetails(req, res) {
  try {
    const { username } = req.params;
    const { data } = await axios.get(
      `https://api.github.com/users/${username}`
    );
    console.log("fetched from api");
    const repos = data.public_repos;
    await redisClient.set(username, repos);
    console.log(repos);
    res.status(200);
    res.send({ repos });
  } catch (error) {
    res.status(500);
    res.send("error");
  }
}
app.get("/:username", cache, fetchUserDetails);
app.listen(port, async () => {
  await redisClient.connect();
  console.log(`App running on port : ${port}`);
});
