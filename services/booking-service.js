const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const { BookingRepository } = require("../repositories");
const db = require("../models");
const { ServerConfig } = require("../config");
const AppError = require("../utils/errors/app-error");
const { Enums } = require("../utils/common");
const { BOOKED, CANCELLED, PENDING, INITIATED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data) {
  const transaction = await db.sequelize.transaction(); // unmanaged transaction
  try {
    const flight = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`
    );
    const flightData = flight.data.data;
    console.log(flightData);
    if (data.noOfSeats > flightData.totalSeats) {
      throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
    }

    const totalBillingAmount = flightData.price * data.noOfSeats;
    const bookingPayload = { ...data, totalCost: totalBillingAmount };
    const booking = await bookingRepository.create(bookingPayload, transaction);

    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
      {
        seats: data.noOfSeats,
      }
    );
    // console.log(totalBillingAmount);
    await transaction.commit(); // manually commit
    return booking;
  } catch (error) {
    await transaction.rollback(); // manually rollback
    throw error;
  }
}

async function makePayment(data) {
  const transaction = await db.sequelize.transaction();
  console.log(data);
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );
    if (bookingDetails.status == CANCELLED) {
      throw new AppError("The booking has expired", StatusCodes.BAD_REQUEST);
    }

    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();
    if (currentTime - bookingTime > 300000) {
      await bookingRepository.update(
        data.bookingId,
        {
          status: CANCELLED,
        },
        transaction
      );
      throw new AppError("The booking has expired", StatusCodes.BAD_REQUEST);
    }
    if (bookingDetails.totalCost != data.totalCost) {
      console.log(typeof bookingDetails.totalCost);
      console.log(typeof data.totalCost);
      throw new AppError(
        "Amount of payment doesnt match",
        StatusCodes.BAD_REQUEST
      );
    }

    if (bookingDetails.userId != data.userId) {
      throw new AppError(
        "User of corresponding to this booking doesnt match",
        StatusCodes.BAD_REQUEST
      );
    }

    // we assume payment is success
    await bookingRepository.update(
      data.bookingId,
      {
        status: BOOKED,
      },
      transaction
    );
    await transaction.commit(); //sadd return response
  } catch (error) {
    await transaction.rollback(); // manually rollback
    throw error;
  }
}

module.exports = { createBooking, makePayment };
