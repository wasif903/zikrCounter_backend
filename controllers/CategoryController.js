import Joi from "joi";
import CategoryModel from "../models/CategoryModel.js";
import User from "../models/User.js";
import CounterModel from "../models/CounterModel.js";
import validateData from "../utils/validator.js";
import moment from "moment-timezone";

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
    const { data } = req.body;

    console.log(data);

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid Format" });
    }

    const error = [];
    const validate = data.map(async (item) => {
      try {
        if (item.userID && item.catID) {
          error.push({
            ...item,
            error: { message: "userID or catID doesn't exists!" },
          });
        }

        const findUser = await User.findById(item.userID);
        if (!findUser) {
          error.push({
            ...item,
            error: { message: "User Not Found" },
          });
        }

        const findCat = await CategoryModel.findById(item.catID);
        if (!findCat) {
          error.push({
            ...item,
            error: { message: "Category Not Found" },
          });
        }
      } catch (error) {
        console.log(error);
        error.push({
          ...item,
          error: { message: "Invalid Request" },
        });
      }
    });

    const resolved = await Promise.all(validate);

    console.log(error);

    if (error.length !== 0) {
      await CounterModel.insertMany(data);
      res.status(201).json({ message: "Count Created Successfully" });
    } else {
      res.status(201).json({ message: "Error Updating Data", error });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const HandleGetSingleCat = async (req, res) => {
  try {
    const { userID, catID } = req.params;
    const { month } = req.query;

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
    const queryYear = currentDate.year();

    const startOfMonth = moment
      .tz({ year: queryYear, month: queryMonth, day: 1 }, "UTC")
      .toDate();
    const endOfMonth = moment(startOfMonth).add(1, "month").toDate();

    const startOfDay = currentDate.startOf("day").toDate();
    const endOfDay = currentDate.endOf("day").toDate();

    const getCountsPerDay = await CounterModel.find({
      userID,
      catID,
      createdAt: {
        $gte: new Date(startOfMonth),
        $lt: new Date(endOfMonth),
      },
    });

    // Group by date and count occurrences
    const groupedData = getCountsPerDay.reduce((acc, item) => {
      const date = moment(item.createdAt).tz("UTC").format("YYYY-MM-DD");
      if (acc[date]) {
        acc[date].count += 1;
      } else {
        acc[date] = { date, count: 1 };
      }
      return acc;
    }, {});

    // Convert grouped data to an array
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

const HandleGetHistory = async (req, res) => {
  try {
    const { userID } = req.params;
    const { month } = req.query;

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

    const currentDate = moment().tz("UTC");
    const queryMonth = month ? parseInt(month, 10) - 1 : currentDate.month();
    const queryYear = currentDate.year();

    const startOfMonth = moment
      .tz({ year: queryYear, month: queryMonth, day: 1 }, "UTC")
      .toDate();
    const endOfMonth = moment(startOfMonth).add(1, "month").toDate();

    const userCatMap = userCategories.map(async (category) => {
      const getCountsPerDay = await CounterModel.find({
        userID,
        catID: category._id,
        createdAt: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      });

      const mappingDaybyDay = getCountsPerDay.reduce((acc, item) => {
        const date = moment(item.createdAt).startOf('day').toDate();

        const existingDay = acc.find(d => moment(d.date).isSame(date, 'day'));

        if (existingDay) {

          const categoryIndex = existingDay.countHistory.findIndex(
            (entry) => entry.categoryName === category.categoryName
          );
          
          if (categoryIndex !== -1) {
            existingDay.countHistory[categoryIndex].count += 1;
          } else {
            existingDay.countHistory.push({
              categoryName: category.categoryName,
              count: 1,
            });
          }
        } else {
          // Otherwise, create a new entry for the date
          acc.push({
            date,
            countHistory: [
              {
                categoryName: category.categoryName,
                count: 1, 
              },
            ],
          });
        }

        return acc;
      }, []);

      return mappingDaybyDay;
    });

    const resolved = await Promise.all(userCatMap);
    
    const combinedHistory = resolved.flat().reduce((acc, item) => {
      const existingDay = acc.find(d => moment(d.date).isSame(item.date, 'day'));

      if (existingDay) {
        item.countHistory.forEach(cat => {
          const existingCategory = existingDay.countHistory.find(c => c.categoryName === cat.categoryName);
          
          if (existingCategory) {
            existingCategory.count += cat.count;
          } else {
            existingDay.countHistory.push(cat);
          }
        });
      } else {
        acc.push(item);
      }

      return acc;
    }, []);

    res.status(200).json({
      user: findUser,
      history: combinedHistory,
    });
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
};
