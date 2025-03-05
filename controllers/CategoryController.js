import Joi from "joi";
import CategoryModel from "../models/CategoryModel.js";
import User from "../models/User.js";
import CounterModel from "../models/CounterModel.js";
import validateData from "../utils/validator.js";
import moment from "moment-timezone";
import mongoose from "mongoose";

const HandleCreateCAtegory = async (req, res) => {
  try {
    const { userID } = req.params;
    if (!userID) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const schema = Joi.object({
      categoryName: Joi.string().required(),
      image: Joi.string().required(),
      lastOpened: Joi.string().default(""),
    });

    const { error, value } = validateData(schema, req.body);

    if (error) {
      return reply.status(400).send({ message: error });
    }

    const { categoryName, image, lastOpened } = value;

    const findUser = await User.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const findExisting = await CategoryModel.findOne({
      userID,
      categoryName,
    });
    if (findExisting) {
      return res
        .status(200)
        .json({ message: "Category With This Name Already Exists" });
    }
    const newCategory = new CategoryModel({
      userID,
      categoryName,
      image,
      lastOpened,
    });
    await newCategory.save();
    res.status(201).json({ message: "Category Created Successfully" });
  } catch (error) {
    console.log(error);
  }
};

const HandleGetUserCategories = async (req, res) => {
  try {
    const { userID } = req.params;
    if (!userID) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const findUser = await User.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userCategories = await CategoryModel.find({ userID });
    res.status(200).json(userCategories);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleCount = async (req, res) => {
  try {
    const { count } = req.body;

    const countInt = parseInt(count, 10);
    if (isNaN(countInt)) {
      return res.status(400).json({ message: "Invalid Count" });
    }

    if (countInt <= 0) {
      return res
        .status(400)
        .json({ message: "Count must be a positive integer" });
    }

    const { userID, catID } = req.params;
    if (!userID || !catID) {
      return res
        .status(400)
        .json({ message: "Invalid User ID or Category ID" });
    }
    const findUser = await User.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const findCategory = await CategoryModel.findById(catID);
    if (!findCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    // const findCounter = await CounterModel.findOne({ userID, catID });
    // if (!findCounter) {
    //   return res.status(404).json({ message: "Unauthorized Request" });
    // }

    const createArr = Array.from({ length: countInt }, () => {
      return {
        userID,
        catID,
      };
    });

    await CounterModel.insertMany(createArr);
    res.status(201).json({ message: "Counts Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleGetSingleCat = async (req, res) => {
  try {
    const { userID, catID } = req.params;
    const { month, year } = req.query;

    if (!userID || !catID) {
      return res
        .status(400)
        .json({ message: "Invalid User ID or Category ID" });
    }

    const findUser = await User.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const findCategory = await CategoryModel.findById(catID);
    if (!findCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    findCategory.lastOpened = moment().tz("UTC").toDate();
    await findCategory.save();

    const currentDate = moment().tz("UTC");
    const queryMonth = month ? parseInt(month, 10) - 1 : currentDate.month();
    const queryYear = year ? parseInt(year, 10) : currentDate.year();

    const startOfMonth = moment
      .tz({ year: queryYear, month: queryMonth, day: 1 }, "UTC")
      .startOf("day")
      .toDate();
    const endOfMonth = moment(startOfMonth)
      .add(1, "month")
      .startOf("day")
      .toDate();

    const startOfDay = currentDate.startOf("day").toDate();
    const endOfDay = currentDate.endOf("day").toDate();

    const getCountsPerDay = await CounterModel.find({
      userID,
      catID,
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    const groupedData = getCountsPerDay.reduce((acc, item) => {
      const date = moment(item.createdAt).tz("UTC").format("YYYY-MM-DD");
      if (acc[date]) {
        acc[date].count += 1;
      } else {
        acc[date] = { date, count: 1 };
      }
      return acc;
    }, {});

    const mapData = Object.values(groupedData);

    const todayCount = await CounterModel.countDocuments({
      userID,
      catID,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const totalCount = await CounterModel.countDocuments({
      userID,
      catID,
    });

    res.status(200).json({
      category: findCategory,
      todayCount,
      totalCount,
      countsByDay: mapData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const HandleGetHistory = async (req, res) => {
//   try {
//     const { userID } = req.params;
//     const { month, year } = req.query;

//     const startDate = req.query.startDate;
//     const endDate = req.query.endDate?.split("T")?.[0];

//     let createdAt = {};
//     if (startDate) createdAt.$gte = new Date(startDate);
//     if (endDate) createdAt.$lte = new Date(`${endDate}T23:59:59.000Z`);

//     if (startDate) {
//       createdAt = { $gte: new Date(startDate) };
//     }
//     if (endDate) {
//       const getEndOfDay = new Date(`${endDate}T23:59:59.000Z`);
//       createdAt = { ...createdAt, $lte: new Date(getEndOfDay) };
//     }

//     const findUser = await User.findById(userID);
//     if (!findUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userCategories = await CategoryModel.find({ userID });

//     if (!userCategories.length) {
//       return res
//         .status(404)
//         .json({ message: "No categories found for this user" });
//     }

//     const userCatMap = userCategories.map(async (category) => {
//       const getCountsPerDay = await CounterModel.find({
//         userID,
//         catID: category._id,
//         createdAt
//       });

//       const mappingDaybyDay = getCountsPerDay.reduce((acc, item) => {
//         if (existingDay) {
//           const categoryIndex = existingDay.countHistory.findIndex(
//             (entry) => entry.categoryName === category.categoryName
//           );

//           if (categoryIndex !== -1) {
//             existingDay.countHistory[categoryIndex].count += 1;
//           } else {
//             existingDay.countHistory.push({
//               categoryName: category.categoryName,
//               count: 1,
//             });
//           }
//         } else {
//           // Otherwise, create a new entry for the date
//           acc.push({
//             date,
//             countHistory: [
//               {
//                 categoryName: category.categoryName,
//                 count: 1,
//               },
//             ],
//           });
//         }

//         return acc;
//       }, []);

//       return mappingDaybyDay;
//     });

//     const resolved = await Promise.all(userCatMap);

//     const combinedHistory = resolved.flat().reduce((acc, item) => {
//       const existingDay = acc.find((d) =>
//         moment(d.date).isSame(item.date, "day")
//       );

//       if (existingDay) {
//         item.countHistory.forEach((cat) => {
//           const existingCategory = existingDay.countHistory.find(
//             (c) => c.categoryName === cat.categoryName
//           );

//           if (existingCategory) {
//             existingCategory.count += cat.count;
//           } else {
//             existingDay.countHistory.push(cat);
//           }
//         });
//       } else {
//         acc.push(item);
//       }

//       return acc;
//     }, []);

//     res.status(200).json({
//       user: findUser,
//       history: combinedHistory,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// Working Fine
// const HandleGetHistory = async (req, res) => {
//   try {
//     const { userID } = req.params;
//     const { month, year } = req.query;

//     const startDate = req.query.startDate;
//     const endDate = req.query.endDate?.split("T")?.[0];

//     let createdAt = {};
//     if (startDate) createdAt.$gte = new Date(startDate);
//     if (endDate) createdAt.$lte = new Date(`${endDate}T23:59:59.000Z`);

//     if (startDate) {
//       createdAt = { $gte: new Date(startDate) };
//     }
//     if (endDate) {
//       const getEndOfDay = new Date(`${endDate}T23:59:59.000Z`);
//       createdAt = { ...createdAt, $lte: new Date(getEndOfDay) };
//     }

//     const findUser = await User.findById(userID);
//     if (!findUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userCategories = await CategoryModel.find({ userID });

//     if (!userCategories.length) {
//       return res
//         .status(404)
//         .json({ message: "No categories found for this user" });
//     }

//     const userCatMap = userCategories.map(async (category) => {
//       const getCountsPerDay = await CounterModel.find({
//         userID,
//         catID: category._id,
//         createdAt,
//       });

//       const mappingDaybyDay = getCountsPerDay.reduce((acc, item) => {
//         const existingDay = acc.find((entry) => {
//           // Ensure item.createdAt is a Date object or convert it
//           const itemDate = new Date(item.createdAt);
//           const entryDate = new Date(entry.date);
//           return itemDate.toDateString() === entryDate.toDateString(); // Compare only by the day
//         });

//         if (existingDay) {
//           const categoryIndex = existingDay.countHistory.findIndex(
//             (entry) => entry.categoryName === category.categoryName
//           );

//           if (categoryIndex !== -1) {
//             existingDay.countHistory[categoryIndex].count += 1;
//           } else {
//             existingDay.countHistory.push({
//               categoryName: category.categoryName,
//               count: 1,
//             });
//           }
//         } else {
//           // Ensure item.createdAt is a Date object and use toISOString for a string format
//           const dateString = new Date(item.createdAt).toISOString().split("T")[0]; // Extract date part

//           acc.push({
//             date: dateString, // Only date part
//             countHistory: [
//               {
//                 categoryName: category.categoryName,
//                 count: 1,
//               },
//             ],
//           });
//         }

//         return acc;
//       }, []);

//       return mappingDaybyDay;
//     });

//     const resolved = await Promise.all(userCatMap);

//     const combinedHistory = resolved.flat().reduce((acc, item) => {
//       const existingDay = acc.find((d) => {
//         const itemDate = new Date(item.date);
//         const entryDate = new Date(d.date);
//         return itemDate.toDateString() === entryDate.toDateString(); // Compare only by the day
//       });

//       if (existingDay) {
//         item.countHistory.forEach((cat) => {
//           const existingCategory = existingDay.countHistory.find(
//             (c) => c.categoryName === cat.categoryName
//           );

//           if (existingCategory) {
//             existingCategory.count += cat.count;
//           } else {
//             existingDay.countHistory.push(cat);
//           }
//         });
//       } else {
//         acc.push(item);
//       }

//       return acc;
//     }, []);

//     res.status(200).json({
//       user: findUser,
//       history: combinedHistory,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const HandleGetHistory = async (req, res) => {
  try {
    const { userID } = req.params;
    const { month, year } = req.query;

    const startDate = req.query.startDate;
    const endDate = req.query.endDate?.split("T")?.[0];

    let createdAt = {};
    if (startDate) createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) createdAt.$lte = new Date(`${endDate}T23:59:59.000Z`);

    if (startDate) {
      createdAt = { $gte: new Date(`${startDate}T00:00:00.000Z`)};
    }
    if (endDate) {
      const getEndOfDay = new Date(`${endDate}T23:59:59.000Z`);
      createdAt = { ...createdAt, $lte: new Date(getEndOfDay) };
    }

    const findUser = await User.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userCategories = await CategoryModel.find({ userID });

    if (!userCategories.length) {
      return res
        .status(404)
        .json({ message: "No categories found for this user" });
    }

    const catIds = userCategories.map((item) => item._id);

    const pipeline = [
      {
        $match: {
          userID: new mongoose.Types.ObjectId(userID),
          createdAt,
          catID: { $in: catIds },
        },
      },
      // Group by the date and catID, and count the occurrences
      {
        $group: {
          _id: {
            date: { $substr: [{ $toString: "$createdAt" }, 0, 10] }, // Extract YYYY-MM-DD date format
            catID: "$catID",
          },
          count: { $sum: 1 }, // Count the occurrences
        },
      },
      // Lookup category data to get category name
      {
        $lookup: {
          from: "categories", // The categories collection
          localField: "_id.catID",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" }, // Flatten the category object
      {
        $project: {
          date: "$_id.date",
          categoryName: "$category.categoryName",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 }, // Optional: Sort by date
      },
    ];

    const counter = await CounterModel.aggregate(pipeline);

    res.status(200).json({
      user: findUser,
      history: counter,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const HandleGetHistory = async (req, res) => {
//   try {
//     const { userID } = req.params;
//     const { month, year } = req.query;

//     const startDate = req.query.startDate;
//     const endDate = req.query.endDate?.split("T")?.[0];

//     let createdAt = {};

//     // Ensure time of startDate is set to 00:00:00
//     if (startDate) {
//       createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
//     }

//     // Ensure time of endDate is set to 23:59:59
//     if (endDate) {
//       createdAt.$lte = new Date(`${endDate}T23:59:59.000Z`);
//     }

//     console.log(createdAt, "createdAt")

//     const findUser = await User.findById(userID);
//     if (!findUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userCategories = await CategoryModel.find({ userID });

//     if (!userCategories.length) {
//       return res
//         .status(404)
//         .json({ message: "No categories found for this user" });
//     }

//     const catIds = userCategories.map((item) => item._id);

//     const pipeline = [
//       {
//         $match: {
//           userID: new mongoose.Types.ObjectId(userID),
//           createdAt: createdAt,
//           catID: { $in: catIds },
//         },
//       },
//       // Group by the date and catID, and count the occurrences
//       {
//         $group: {
//           _id: {
//             date: { $substr: [{ $toString: "$createdAt" }, 0, 10] }, // Extract YYYY-MM-DD date format
//             catID: "$catID",
//           },
//           count: { $sum: 1 }, // Count the occurrences
//         },
//       },
//       // Lookup category data to get category name
//       {
//         $lookup: {
//           from: "categories", // The categories collection
//           localField: "_id.catID",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       { $unwind: "$category" }, // Flatten the category object
//       {
//         $project: {
//           date: "$_id.date",
//           categoryName: "$category.categoryName",
//           count: 1,
//           _id: 0,
//         },
//       },
//       {
//         $sort: { date: 1 }, // Optional: Sort by date
//       },
//     ];

//     const counter = await CounterModel.aggregate(pipeline);

//     res.status(200).json({
//       user: findUser,
//       history: counter,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


const HandleDeleteCat = async (req, res) => {
  try {
    const { userID, categoryID } = req.params;
    if (!userID) {
      return res.status(400).json({ message: "Invalid userID ID" });
    }
    if (!categoryID) {
      return res.status(400).json({ message: "Invalid Category ID" });
    }

    const findCategory = await CategoryModel.findByIdAndDelete(categoryID);
    if (!findCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    await CounterModel.deleteMany({
      userID,
      catID: categoryID,
    });
    res.status(200).json({ message: "Category Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleUpdateCategory = async (req, res) => {
  try {
    const { userID, categoryID } = req.params;
    const { categoryName } = req.body;
    if (!userID) {
      return res.status(400).json({ message: "Invalid userID ID" });
    }
    if (!categoryID) {
      return res.status(400).json({ message: "Invalid Category ID" });
    }
    if (!categoryName) {
      return res.status(400).json({ message: "Invalid Category Name" });
    }
    const findCategory = await CategoryModel.findById(categoryID);
    if (!findCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    findCategory.categoryName = categoryName;
    await findCategory.save();
    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  HandleCreateCAtegory,
  HandleGetUserCategories,
  HandleCount,
  HandleGetSingleCat,
  HandleGetHistory,
  HandleDeleteCat,
  HandleUpdateCategory,
};

// const HandleGetHistory = async (req, res) => {
//   try {
//     const { userID } = req.params;
//     const { from, to } = req.query; // Get from and to dates from query parameters

//     // Validate the "from" and "to" date parameters
//     if (!from || !to) {
//       return res.status(400).json({ message: "'from' and 'to' dates are required" });
//     }

//     const fromDate = moment(from).tz("UTC");
//     const toDate = moment(to).tz("UTC");

//     if (!fromDate.isValid() || !toDate.isValid()) {
//       return res.status(400).json({ message: "Invalid date format" });
//     }

//     // Ensure "from" date is before "to" date
//     if (fromDate.isAfter(toDate)) {
//       return res.status(400).json({ message: "'from' date cannot be after 'to' date" });
//     }

//     const findUser = await User.findById(userID);
//     if (!findUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const userCategories = await CategoryModel.find({ userID });

//     if (!userCategories.length) {
//       return res.status(404).json({ message: "No categories found for this user" });
//     }

//     const userCatMap = userCategories.map(async (category) => {
//       const getCountsPerDay = await CounterModel.find({
//         userID,
//         catID: category._id,
//         createdAt: {
//           $gte: fromDate.toDate(), // Filter by "from" date
//           $lte: toDate.endOf('day').toDate(), // Filter by "to" date (end of the day)
//         },
//       });

//       const mappingDaybyDay = getCountsPerDay.reduce((acc, item) => {
//         const date = moment(item.createdAt).startOf("day").toDate();

//         const existingDay = acc.find((d) => moment(d.date).isSame(date, "day"));

//         if (existingDay) {
//           const categoryIndex = existingDay.countHistory.findIndex(
//             (entry) => entry.categoryName === category.categoryName
//           );

//           if (categoryIndex !== -1) {
//             existingDay.countHistory[categoryIndex].count += 1;
//           } else {
//             existingDay.countHistory.push({
//               categoryName: category.categoryName,
//               count: 1,
//             });
//           }
//         } else {
//           // Otherwise, create a new entry for the date
//           acc.push({
//             date,
//             countHistory: [
//               {
//                 categoryName: category.categoryName,
//                 count: 1,
//               },
//             ],
//           });
//         }

//         return acc;
//       }, []);

//       return mappingDaybyDay;
//     });

//     const resolved = await Promise.all(userCatMap);

//     const combinedHistory = resolved.flat().reduce((acc, item) => {
//       const existingDay = acc.find((d) =>
//         moment(d.date).isSame(item.date, "day")
//       );

//       if (existingDay) {
//         item.countHistory.forEach((cat) => {
//           const existingCategory = existingDay.countHistory.find(
//             (c) => c.categoryName === cat.categoryName
//           );

//           if (existingCategory) {
//             existingCategory.count += cat.count;
//           } else {
//             existingDay.countHistory.push(cat);
//           }
//         });
//       } else {
//         acc.push(item);
//       }

//       return acc;
//     }, []);

//     res.status(200).json({
//       user: findUser,
//       history: combinedHistory,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
