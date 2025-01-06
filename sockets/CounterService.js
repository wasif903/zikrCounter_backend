import moment from "moment";
import CounterModel from "../models/CounterModel.js";

const CounterService = (io) => {
    let connectedUsers = {};
    let counters = [];

    io.on("connection", (socket) => {
        const userID = socket.handshake.query.userID;
        console.log(userID);
        console.log("Connected to socket.io");

        socket.on("setup", async (userID) => {
            if (connectedUsers[userID] && connectedUsers[userID] !== socket.id) {
                console.log(`User already connected with a different socket ID. Replacing socket ID for ${userID}.`);
            }

            socket.join(userID);
            connectedUsers[userID] = socket.id;

            console.log(
                Object.keys(connectedUsers).map((item) => item),
                "Connected to socket.io"
            );

            socket.emit("connected", socket.id);
        });

        socket.on("get-total-count", async ({ userID, cardID }) => {
            const startOfDay = moment().startOf("day").toDate();
            const todayCounts = await CounterModel.find({
                userID: userID,
                catID: cardID,
                createdAt: { $gte: startOfDay },
            });
            socket.emit("total-count", todayCounts.length);
            console.log(startOfDay, "startOfDay");
            console.log(todayCounts.length, "get-total-count");
        });

        socket.on("plus-counting", async (data) => {
            try {
                const startOfDay = moment().startOf("day").toDate();
                const todayCounts = await CounterModel.find({
                    userID: userID,
                    catID: data.catID,
                    createdAt: { $gte: startOfDay },
                });
                counters.push(data);
                const filterArr = counters.filter((i) => i.userID === userID);
                socket.emit("total-count", todayCounts.length + filterArr.length);
            } catch (error) {
                console.error("Error in plus-counting:", error);
                socket.emit("error", "Failed to calculate the count.");
            }
        });

        socket.on("minus-counting", async (data) => {
            try {
                const startOfDay = moment().startOf("day").toDate();
                const todayCounts = await CounterModel.find({
                    userID: data.userID,
                    catID: data.catID,
                    createdAt: { $gte: startOfDay },
                });
                const index = counters.findIndex((item) => item.userID === data.userID && item.catID === data.catID);
                if (index !== -1) {
                    counters.splice(index, 1);
                }

                if (todayCounts.length > 0) {
                    await CounterModel.deleteOne({
                        userID: data.userID,
                        catID: data.catID,
                        createdAt: { $gte: startOfDay },
                    });
                }
                const filterArr = counters.filter((i) => i.userID === data.userID);
                const updatedCount = todayCounts.length + filterArr.length;
                socket.emit("total-count", updatedCount);
            } catch (error) {
                console.error("Error in minus-counting:", error);
                socket.emit("error", "Failed to calculate the count.");
            }
        });

        socket.on("manual-disconnect", (id) => {
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
                console.log("UserID not found in connectedUsers on disconnect:", userID);
            }
            console.log("Updated Connected Users after actual disconnect:", connectedUsers);
        });
    });
};

export { CounterService };
