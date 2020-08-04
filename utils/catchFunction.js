exports.catchHandler = (fn) => {
  return (request, response, next) => {
    fn(request, response, next).catch(next);
  };
};

exports.catchParam = (fn) => {
  return (request, response, next, param) => {
    fn(request, response, next, param).catch(next);
  };
};
