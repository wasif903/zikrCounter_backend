import moment from "moment";
import CounterModel from "../models/CounterModel.js";

const CounterService = io => {
  let connectedUsers = {};
  let counters = [];

  io.on("connection", socket => {
    const userID = socket.handshake.query.userID;
    console.log(userID);
    console.log("Connected to socket.io");

    socket.on("setup", async userID => {
      if (connectedUsers[userID] && connectedUsers[userID] !== socket.id) {
        console.log(
          `User already connected with a different socket ID. Replacing socket ID for ${userID}.`
        );
      }

      socket.join(userID);
      connectedUsers[userID] = socket.id;

      console.log(
        Object.keys(connectedUsers).map(item => item),
        "Connected to socket.io"
      );

      socket.emit("connected", socket.id);
    });

    socket.on("get-total-count", async ({ userID, cardID }) => {
      const startOfDay = moment().startOf("day").toDate();
      const endOfDay = moment().endOf("day").toDate();

      console.log(userID)
      console.log(cardID)

      const todayCounts = await CounterModel.countDocuments({
        userID: userID,
        catID: cardID,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      socket.emit("total-count", todayCounts);
      console.log(startOfDay, "startOfDay");
      console.log(endOfDay, "endOfDay");
      console.log(todayCounts, "todayCounts");
    });

    socket.on("plus-counting", async data => {
      try {
        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();
        const createCount = new CounterModel({
          userID: data.userID,
          catID: data.catID
        });
        await createCount.save();
        const todayCounts = await CounterModel.countDocuments({
          userID: userID,
          catID: data.catID,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
        socket.emit("total-count", todayCounts);
      } catch (error) {
        console.error("Error in plus-counting:", error);
        socket.emit("error", "Failed to calculate the count.");
      }
    });

    socket.on("minus-counting", async data => {
      try {
        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();

        await CounterModel.findOneAndDelete({
          userID: data.userID,
          catID: data.catID,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const todayCounts = await CounterModel.countDocuments({
          userID: data.userID,
          catID: data.catID,
          createdAt: { $gte: startOfDay }
        });

        socket.emit("total-count", todayCounts);
      } catch (error) {
        console.error("Error in minus-counting:", error);
        socket.emit("error", "Failed to calculate the count.");
      }
    });

    socket.on("manual-disconnect", id => {
      console.log(id);
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
