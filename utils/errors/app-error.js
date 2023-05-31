//  Before this file , we were handling errors with try catch blocks but not sending useful errors.
// Meaning app didnt break , but client will face issues handling the app.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.explanation = message;
  }
}

module.exports = AppError;
