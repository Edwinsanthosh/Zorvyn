require("dotenv").config();
const app = require("./app");
const connectDB = require("../config/db");
const seedData = require("./data/seedData");

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Seed only when database is empty, so repeated server starts do not duplicate data.
  await seedData();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
