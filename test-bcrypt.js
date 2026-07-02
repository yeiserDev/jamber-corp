const bcrypt = require('bcryptjs');

async function run() {
  try {
    const res = await bcrypt.compare("chopchop123", "chopchop123");
    console.log("Result:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
