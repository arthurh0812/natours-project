exports.hideFieldsArray = (docs, ...fields) => {
  return fields.forEach((field) => {
    docs.forEach((doc) => {
      doc[field] = undefined;
    });
  });
};

exports.hideFieldsDocument = (doc, ...fields) => {
  return fields.forEach((field) => {
    doc[field] = undefined;
  });
};
