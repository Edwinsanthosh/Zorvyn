const FinancialRecord = require("../models/FinancialRecord");

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

async function getAllRecords(req, res) {
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
    res.status(500).json({
      message: "Could not fetch records"
    });
  }
}

async function getSingleRecord(req, res) {
  try {
    const record = await FinancialRecord.findOne(getRecordFilter(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!record) {
      return res.status(404).json({
        message: "Record not found"
      });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({
      message: "Invalid record id"
    });
  }
}

async function createRecord(req, res) {
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
    res.status(500).json({
      message: "Could not create record"
    });
  }
}

async function updateRecord(req, res) {
  try {
    const record = await FinancialRecord.findOne(getRecordFilter(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!record) {
      return res.status(404).json({
        message: "Record not found"
      });
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
    res.status(400).json({
      message: "Could not update record"
    });
  }
}

async function deleteRecord(req, res) {
  try {
    const deletedRecord = await FinancialRecord.findOne(getRecordFilter(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!deletedRecord) {
      return res.status(404).json({
        message: "Record not found"
      });
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
    res.status(400).json({
      message: "Could not delete record"
    });
  }
}

module.exports = {
  getAllRecords,
  getSingleRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordFilter,
  buildListFilter,
  buildAppliedFilters
};
