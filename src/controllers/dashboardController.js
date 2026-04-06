const FinancialRecord = require("../models/FinancialRecord");
const { getRecordFilter } = require("./recordController");
const createError = require("../utils/createError");

async function getDashboardSummary(req, res, next) {
  try {
    const financialRecords = await FinancialRecord.find(
      getRecordFilter(req, { isDeleted: false })
    );
    let totalIncome = 0;
    let totalExpense = 0;

    financialRecords.forEach((record) => {
      if (record.type === "income") {
        totalIncome += Number(record.amount);
      } else if (record.type === "expense") {
        totalExpense += Number(record.amount);
      }
    });

    const totalBalance = totalIncome - totalExpense;
    const categoryBreakdown = {};

    // Keeping this loop simple instead of using aggregation so it is easier to explain.
    financialRecords.forEach((record) => {
      if (!categoryBreakdown[record.category]) {
        categoryBreakdown[record.category] = 0;
      }

      categoryBreakdown[record.category] += Number(record.amount);
    });

    res.json({
      totalRecords: financialRecords.length,
      totalIncome,
      totalExpense,
      totalBalance,
      categoryBreakdown
    });
  } catch (error) {
    next(createError("Could not load dashboard summary"));
  }
}

async function getCategoryTotals(req, res, next) {
  try {
    const financialRecords = await FinancialRecord.find(
      getRecordFilter(req, { isDeleted: false })
    );
    const categoryTotals = {};

    financialRecords.forEach((record) => {
      if (!categoryTotals[record.category]) {
        categoryTotals[record.category] = {
          income: 0,
          expense: 0,
          total: 0
        };
      }

      if (record.type === "income") {
        categoryTotals[record.category].income += Number(record.amount);
      } else {
        categoryTotals[record.category].expense += Number(record.amount);
      }

      categoryTotals[record.category].total += Number(record.amount);
    });

    res.json({
      categoryTotals
    });
  } catch (error) {
    next(createError("Could not load category totals"));
  }
}

async function getRecentActivity(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 5;

    // Sorting by createdAt so latest added or updated entries can be shown in dashboard.
    const recentRecords = await FinancialRecord.find(
      getRecordFilter(req, { isDeleted: false })
    )
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      count: recentRecords.length,
      activities: recentRecords
    });
  } catch (error) {
    next(createError("Could not load recent activity"));
  }
}

async function getTrendData(req, res, next) {
  try {
    const type = req.query.type || "monthly";
    const financialRecords = await FinancialRecord.find(
      getRecordFilter(req, { isDeleted: false })
    );
    const trends = {};

    financialRecords.forEach((record) => {
      const recordDate = new Date(record.date);

      if (Number.isNaN(recordDate.getTime())) {
        return;
      }

      let key = "";

      if (type === "weekly") {
        // Week key is basic here. It is enough for small dashboard demo.
        const oneJan = new Date(recordDate.getFullYear(), 0, 1);
        const dayDiff = Math.floor((recordDate - oneJan) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((dayDiff + oneJan.getDay() + 1) / 7);
        key = `${recordDate.getFullYear()}-W${weekNumber}`;
      } else {
        const month = String(recordDate.getMonth() + 1).padStart(2, "0");
        key = `${recordDate.getFullYear()}-${month}`;
      }

      if (!trends[key]) {
        trends[key] = {
          income: 0,
          expense: 0
        };
      }

      if (record.type === "income") {
        trends[key].income += Number(record.amount);
      } else {
        trends[key].expense += Number(record.amount);
      }
    });

    const trendArray = Object.keys(trends)
      .sort()
      .map((key) => ({
        period: key,
        income: trends[key].income,
        expense: trends[key].expense,
        balance: trends[key].income - trends[key].expense
      }));

    res.json({
      trendType: type,
      data: trendArray
    });
  } catch (error) {
    next(createError("Could not load trend data"));
  }
}

module.exports = {
  getDashboardSummary,
  getCategoryTotals,
  getRecentActivity,
  getTrendData
};
