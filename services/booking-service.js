const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { BookingRepository } = require("../repositories");
const db = require("../models");
const { ServerConfig } = require("../config");
const AppError = require("../utils/errors/app-error");

async function createBooking(data) {
  // Created a promise , now controller will wait for the promise to return and then move ahead.
  // Since we have a callback, code wont run line by line
  return new Promise((resolve, reject) => {
    const result = db.sequelize.transaction(async function bookingImpl(t) {
      const flight = await axios.get(
        `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
      );
      const flightData = flight.data.data;
      console.log(flightData);
      if (data.noOfSeats > flightData.totalSeats) {
        reject(
          new AppError("Not enough seats available", StatusCodes.BAD_REQUEST)
        );
      }
      resolve(true);
    });
  });
}

module.exports = { createBooking };
