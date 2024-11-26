const jsonServer = require("json-server");
const auth = require("json-server-auth");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Bind router db to the app
server.db = router.db;

// Add custom auth middleware
server.use(jsonServer.bodyParser);
server.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = router.db.get("users").find({ email: email }).value();

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Check if password matches (either hashed or plain)
  if (user.password === password || user.password === `$2a$10$${password}`) {
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: "dummy_token_for_" + user.id,
    });
  }

  res.status(400).json({ error: "Incorrect password" });
});

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

server.use(router);

server.listen(3333, "0.0.0.0", () => {
  console.log("JSON Server is running on port 3333");
});
