const FinancialRecord = require("../models/FinancialRecord");
const createError = require("../utils/createError");

function getRecordFilter(req, extraFilter = {}) {
  if (req.user && req.user.role === "Viewer") {
    return {
      ...extraFilter,
      user: req.user._id
    };
  }

  return extraFilter;
}

function buildListFilter(req) {
  const filter = getRecordFilter(req, { isDeleted: false });
  const { category, type, date, fromDate, toDate, minAmount, maxAmount } = req.query;

  if (category) {
    filter.category = category;
  }

  if (type) {
    filter.type = type;
  }

  if (date && !fromDate && !toDate) {
    filter.date = date;
  }

  if (fromDate || toDate) {
    filter.date = {};

    if (fromDate) {
      filter.date.$gte = fromDate;
    }

    if (toDate) {
      filter.date.$lte = toDate;
    }
  }

  if (minAmount || maxAmount) {
    filter.amount = {};

    if (minAmount) {
      filter.amount.$gte = Number(minAmount);
    }

    if (maxAmount) {
      filter.amount.$lte = Number(maxAmount);
    }
  }

  return filter;
}

function buildAppliedFilters(req) {
  const { category, type, date, fromDate, toDate, minAmount, maxAmount } = req.query;

  return {
    category: category || "",
    type: type || "",
    date: date || "",
    fromDate: fromDate || "",
    toDate: toDate || "",
    minAmount: minAmount || "",
    maxAmount: maxAmount || ""
  };
}

async function getAllRecords(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const filter = buildListFilter(req);
    const appliedFilters = buildAppliedFilters(req);

    const startIndex = (page - 1) * limit;
    const total = await FinancialRecord.countDocuments(filter);
    const paginatedRecords = await FinancialRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      page,
      limit,
      total,
      filters: appliedFilters,
      data: paginatedRecords
    });
  } catch (error) {
    next(createError("Could not fetch records"));
  }
}

async function getSingleRecord(req, res, next) {
  try {
    const record = await FinancialRecord.findOne(getRecordFilter(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!record) {
      return next(createError("Record not found", 404));
    }

    res.json(record);
  } catch (error) {
    next(createError("Invalid record id", 400));
  }
}

async function createRecord(req, res, next) {
  try {
    const { title, category, amount, type, date, note } = req.body;

    const newRecord = await FinancialRecord.create({
      title,
      category,
      amount: Number(amount),
      type,
      date,
      note: note || "",
      user: req.user._id
    });

    res.status(201).json({
      message: "Record created successfully",
      data: newRecord
    });
  } catch (error) {
    next(createError("Could not create record"));
  }
}

async function updateRecord(req, res, next) {
  try {
    const record = await FinancialRecord.findOne(getRecordFilter(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!record) {
      return next(createError("Record not found", 404));
    }

    const { title, category, amount, type, date, note } = req.body;

    record.title = title;
    record.category = category;
    record.amount = Number(amount);
    record.type = type;
    record.date = date;
    record.note = note || "";

    await record.save();

    res.json({
      message: "Record updated successfully",
      data: record
    });
  } catch (error) {
    next(createError("Could not update record", 400));
  }
}

async function deleteRecord(req, res, next) {
  try {
    const deletedRecord = await FinancialRecord.findOne(getRecordFilter(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!deletedRecord) {
      return next(createError("Record not found", 404));
    }

    // Soft delete is used so the old data is not fully lost.
    deletedRecord.isDeleted = true;
    deletedRecord.deletedAt = new Date();
    await deletedRecord.save();

    res.json({
      message: "Record soft deleted successfully",
      data: deletedRecord
    });
  } catch (error) {
    next(createError("Could not delete record", 400));
  }
}

async function restoreRecord(req, res, next) {
  try {
    const record = await FinancialRecord.findOne({
      _id: req.params.id,
      isDeleted: true
    });

    if (!record) {
      return next(createError("Deleted record not found", 404));
    }

    record.isDeleted = false;
    record.deletedAt = null;
    await record.save();

    res.json({
      message: "Record restored successfully",
      data: record
    });
  } catch (error) {
    next(createError("Could not restore record", 400));
  }
}

module.exports = {
  getAllRecords,
  getSingleRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  restoreRecord,
  getRecordFilter,
  buildListFilter,
  buildAppliedFilters
};
