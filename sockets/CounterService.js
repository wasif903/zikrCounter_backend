const CounterService = (io) => {
  let connectedUsers = {};
  let counters = [];

  io.on("connection", (socket) => {
    const userID = socket.handshake.query.userID;
    console.log(userID);
    console.log("Connected to socket.io");

    socket.on("setup", async (userID) => {
      if (connectedUsers[userID] && connectedUsers[userID] !== socket.id) {
        console.log(
          `User already connected with a different socket ID. Replacing socket ID for ${userID}.`
        );
      }

      socket.join(userID);
      connectedUsers[userID] = socket.id;

      console.log(
        Object.keys(connectedUsers).map((item) => item),
        "Connected to socket.io"
      );

      socket.emit("connected", socket.id);
    });

    socket.on("plus-counting", (data) => {
      counters.push(data);
      const filterArr = counters.filter((i) => i.userID === userID);
      socket.emit("total-count", filterArr);
    });

    socket.on("minus-counting", (data) => {
      console.log(data);
      counters = counters.filter(
        (item) => item.userID !== data.userID || item.catID !== data.catID
      );
      const filterArr = counters.filter((i) => i.userID === userID);
      socket.emit("total-count", filterArr);
    });

    socket.on("manual-disconnect", (id) => {
      console.log(id)
      if (connectedUsers[id]) {
        delete connectedUsers[id];
      } else {
        console.log("User not found:", id);
      }
    });

    socket.on("disconnect", () => {
      if (connectedUsers[userID]) {
        delete connectedUsers[userID];
        console.log("User disconnected:", userID);
      } else {
        console.log(
          "UserID not found in connectedUsers on disconnect:",
          userID
        );
      }
      console.log(
        "Updated Connected Users after actual disconnect:",
        connectedUsers
      );
    });
  });
};

export { CounterService };
