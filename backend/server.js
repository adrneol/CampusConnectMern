const app = require("./server/app");
const http = require("http");
const { connectDatabase } = require("./server/config/db");
const { initSocket } = require("./server/socket");

const port = process.env.PORT || 5000;
const server = http.createServer(app);

connectDatabase().finally(() => {
  initSocket(server);
  server.listen(port, () => {
    console.log(`API running at http://127.0.0.1:${port}`);
  });
});
