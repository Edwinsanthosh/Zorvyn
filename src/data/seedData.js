const bcrypt = require("bcryptjs");
const User = require("../models/User");
const FinancialRecord = require("../models/FinancialRecord");

async function seedData() {
  const userCount = await User.countDocuments();
  const recordCount = await FinancialRecord.countDocuments();

  if (userCount === 0) {
    const viewerPassword = await bcrypt.hash("arun123", 10);
    const secondViewerPassword = await bcrypt.hash("meena123", 10);
    const analystPassword = await bcrypt.hash("kavin123", 10);
    const secondAnalystPassword = await bcrypt.hash("priya123", 10);
    const adminPassword = await bcrypt.hash("nivetha123", 10);
    const secondAdminPassword = await bcrypt.hash("suresh123", 10);

    await User.insertMany([
      {
        name: "Arun Kumar",
        email: "arun@example.com",
        password: viewerPassword,
        role: "Viewer",
        status: "active"
      },
      {
        name: "Meena Lakshmi",
        email: "meena@example.com",
        password: secondViewerPassword,
        role: "Viewer",
        status: "active"
      },
      {
        name: "Kavin Raj",
        email: "kavin@example.com",
        password: analystPassword,
        role: "Analyst",
        status: "active"
      },
      {
        name: "Priya Dharshini",
        email: "priya@example.com",
        password: secondAnalystPassword,
        role: "Analyst",
        status: "active"
      },
      {
        name: "Nivetha Sri",
        email: "nivetha@example.com",
        password: adminPassword,
        role: "Admin",
        status: "active"
      },
      {
        name: "Suresh Babu",
        email: "suresh@example.com",
        password: secondAdminPassword,
        role: "Admin",
        status: "inactive"
      }
    ]);

    console.log("Sample users added");
  }

  if (recordCount === 0) {
    const viewerUser = await User.findOne({ email: "arun@example.com" });
    const secondViewerUser = await User.findOne({ email: "meena@example.com" });
    const analystUser = await User.findOne({ email: "kavin@example.com" });
    const secondAnalystUser = await User.findOne({ email: "priya@example.com" });
    const adminUser = await User.findOne({ email: "nivetha@example.com" });

    await FinancialRecord.insertMany([
      {
        title: "Chennai Branch Revenue",
        category: "Revenue",
        amount: 85000,
        type: "income",
        date: "2026-04-01",
        note: "Revenue from Chennai branch",
        user: adminUser._id
      },
      {
        title: "Coimbatore Office Rent",
        category: "Office Expense",
        amount: 18000,
        type: "expense",
        date: "2026-04-02",
        note: "Monthly rent payment",
        user: analystUser._id
      },
      {
        title: "Madurai Client Payment",
        category: "Revenue",
        amount: 42000,
        type: "income",
        date: "2026-04-03",
        note: "Payment received from client project",
        user: analystUser._id
      },
      {
        title: "Travel Reimbursement",
        category: "Operations",
        amount: 6500,
        type: "expense",
        date: "2026-04-03",
        note: "Team travel reimbursement",
        user: viewerUser._id
      },
      {
        title: "Software Subscription",
        category: "Tools",
        amount: 3200,
        type: "expense",
        date: "2026-04-04",
        note: "Monthly tools payment",
        user: viewerUser._id
      },
      {
        title: "Salem Distributor Payment",
        category: "Revenue",
        amount: 23000,
        type: "income",
        date: "2026-03-18",
        note: "Distributor payment collected",
        user: secondViewerUser._id
      },
      {
        title: "Erode Marketing Spend",
        category: "Marketing",
        amount: 7800,
        type: "expense",
        date: "2026-03-19",
        note: "Poster and local ad expense",
        user: secondViewerUser._id
      },
      {
        title: "Trichy Consulting Revenue",
        category: "Revenue",
        amount: 54000,
        type: "income",
        date: "2026-03-20",
        note: "Consulting amount from Trichy client",
        user: analystUser._id
      },
      {
        title: "Tirunelveli Laptop Purchase",
        category: "Equipment",
        amount: 46000,
        type: "expense",
        date: "2026-03-21",
        note: "Laptop bought for finance team",
        user: analystUser._id
      },
      {
        title: "Karur Vendor Settlement",
        category: "Operations",
        amount: 9800,
        type: "expense",
        date: "2026-03-24",
        note: "Pending vendor settlement cleared",
        user: secondAnalystUser._id
      },
      {
        title: "Tanjore Training Income",
        category: "Training",
        amount: 31000,
        type: "income",
        date: "2026-03-26",
        note: "Corporate training payment received",
        user: secondAnalystUser._id
      },
      {
        title: "Pondicherry Partner Revenue",
        category: "Revenue",
        amount: 47000,
        type: "income",
        date: "2026-03-28",
        note: "Revenue share from partner office",
        user: adminUser._id
      },
      {
        title: "Server Maintenance Bill",
        category: "Tools",
        amount: 12500,
        type: "expense",
        date: "2026-03-29",
        note: "Annual server maintenance payment",
        user: adminUser._id
      },
      {
        title: "Chengalpattu Client Advance",
        category: "Revenue",
        amount: 27000,
        type: "income",
        date: "2026-04-05",
        note: "Advance amount from new client",
        user: secondViewerUser._id
      },
      {
        title: "Branch Utility Charges",
        category: "Office Expense",
        amount: 9100,
        type: "expense",
        date: "2026-04-06",
        note: "Electricity and water charges",
        user: secondAnalystUser._id
      },
      {
        title: "Audit Support Income",
        category: "Services",
        amount: 36000,
        type: "income",
        date: "2026-04-07",
        note: "Support income from audit project",
        user: adminUser._id
      }
    ]);

    console.log("Sample records added");
  }
}

module.exports = seedData;
