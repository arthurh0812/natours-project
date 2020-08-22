const { catchHandler } = require('../utils/catchFunction');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) =>
  catchHandler(async (request, response, next) => {
    const doc = await Model.findOneAndDelete({ _id: request.params.id });

    if (!doc) return next(new AppError('No document found with that ID', 404));

    response.status(204).json({
      status: 'success',
      data: null,
      timeMilliseconds: doc.queryTime,
      deletedAt: doc.requestTime,
    });
  });
