import Joi from "joi";
import CategoryModel from "../models/CategoryModel.js";
import User from "../models/User.js";
import CounterModel from "../models/CounterModel.js";

const HandleCreateCAtegory = async (req, res) => {
  try {
    const { userID } = req.params;
    if (!userID) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const schema = Joi.object({
      categoryName: Joi.string().required()
    });

    

    const { error, value } = validateData(schema, req.body);

    if (error) {
      return reply.status(400).send({ message: error });
    }

    const { categoryName } = value;

    const findUser = await User.findById(userID);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const findExisting = await CategoryModel.findOne({
      userID,
      categoryName
    });
    if (findExisting) {
      return res
        .status(200)
        .json({ message: "Category With This Name Already Exists" });
    }
    const newCategory = new CategoryModel({
      userID,
      categoryName
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
    const { data } = req.params;

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid Format" });
    }

    const error = [];
    const validate = data.map(async item => {
      try {
        if (item.userID && item.catID) {
          error.push({
            ...item,
            error: { message: "userID or catID doesn't exists!" }
          });
        }

        const findUser = await User.findById(item.userID);
        if (!findUser) {
          error.push({
            ...item,
            error: { message: "User Not Found" }
          });
        }

        const findCat = await CategoryModel.findById(item.catID);
        if (!findCat) {
          error.push({
            ...item,
            error: { message: "Category Not Found" }
          });
        }
      } catch (error) {
        console.log(error);
        error.push({
          ...item,
          error: { message: "Invalid Request" }
        });
      }
    });

    const resolved = await Promise.all(validate);

    if (error.length !== 0) {
      await CategoryModel.insertMany(data);
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

    const currentDate = new Date();
    const queryMonth = month ? parseInt(month, 10) - 1 : currentDate.getMonth();
    const queryYear = currentDate.getFullYear();

    const startOfMonth = new Date(queryYear, queryMonth, 1);
    const endOfMonth = new Date(queryYear, queryMonth + 1, 1);

    const startOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    const endOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1
    );

    const countsByDay = await CounterModel.aggregate([
      {
        $match: {
          userID,
          categoryID: catID,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const todayCount = await CounterModel.countDocuments({
      userID,
      categoryID: catID,
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const totalCount = await CounterModel.countDocuments({
      userID,
      categoryID: catID
    });

    res.status(200).json({
      category: findCategory,
      todayCount,
      totalCount,
      countsByDay
    });
  } catch (error) {
    console.log(error);
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

    const currentDate = new Date();
    const queryMonth = month ? parseInt(month, 10) - 1 : currentDate.getMonth();
    const queryYear = currentDate.getFullYear();

    const startOfMonth = new Date(queryYear, queryMonth, 1);
    const endOfMonth = new Date(queryYear, queryMonth + 1, 1);

    const history = await CounterModel.aggregate([
      {
        $match: {
          userID,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            catID: "$catID",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.catID",
          dailyCounts: {
            $push: {
              date: "$_id.date",
              count: "$count"
            }
          }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $unwind: "$categoryDetails"
      },
      {
        $project: {
          _id: 0,
          categoryID: "$_id",
          categoryName: "$categoryDetails.name",
          dailyCounts: 1
        }
      }
    ]);

    res.status(200).json({
      user: findUser,
      history
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
  HandleGetHistory
};
