const cron = require("node-cron");
const { BookingService } = require("../../services/");

function scheduleCrons() {
  // check in every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    await BookingService.cancelOldBookings();
    // console.log(res);
  });
}

module.exports = scheduleCrons;
