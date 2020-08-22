/* eslint-disable array-callback-return */
// MODULES
const APIFeatures = require('../utils/apiFeatures');
const { hideFieldsArray, hideFieldsDocument } = require('../utils/hideFields');
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
      deletedAt: request.requestTime,
    });
  });

exports.updateOne = (Model) =>
  catchHandler(async (request, response, next) => {
    const doc = await Model.findOneAndUpdate(
      { _id: request.params.id },
      request.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doc) return next(new AppError('No document found with that ID', 404));

    hideFieldsDocument(
      doc,
      'password',
      'passwordFailures',
      'usernameChangedAt',
      'passwordChangedAt'
    );

    response.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
      timeMilliseconds: doc.queryTime,
      updatedAt: request.requestTime,
    });
  });

exports.createOne = (Model) =>
  catchHandler(async (request, response, next) => {
    const newDoc = await Model.create(request.body);

    response.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
      timeMilliseconds: newDoc.creationTime,
      createdAt: request.requestTime,
    });
  });

exports.getOne = (Model, populationOptions) =>
  catchHandler(async (request, response, next) => {
    let docQuery = Model.findById(request.params.id);

    if (populationOptions) docQuery = docQuery.populate(populationOptions);

    const doc = await docQuery;

    if (!doc) return next(new AppError('No document found with that ID!', 404));

    hideFieldsDocument(
      doc,
      'password',
      'passwordFailures',
      'usernameChangedAt',
      'passwordChangedAt'
    );

    response.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
      timeMilliseconds: doc.queryTime,
      requestedAt: request.requestTime,
    });
  });

exports.getAll = (Model) =>
  catchHandler(async (request, response, next) => {
    // PROCESSING QUERY
    const docs = await new APIFeatures(
      Model.find(request.filterObj),
      request.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate().query;

    hideFieldsArray(
      docs,
      'password',
      'passwordFailures',
      'usernameChangedAt',
      'passwordChangedAt'
    );

    // SENDING RESPONSE
    response.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
      timeMilliseconds: docs.queryTime,
      requestedAt: request.requestTime,
    });
  });
