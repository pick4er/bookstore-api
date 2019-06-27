const path = require('path');
/* eslint-disable-next-line import/no-extraneous-dependencies */
const dotenv = require('dotenv');

const envPaths = {
  production: path.resolve('./', '.env.production'),
  development: path.resolve('./', '.env.development'),
};

module.exports = function getEnvs() {
  if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: envPaths.production });
  } else {
    if (process.env.NODE_ENV !== 'development') {
      /* eslint-disable no-multi-str */
      console.log(
        `${process.env.NODE_ENV} NODE_ENV is invalid.\
        Either development or production required.\
        Will use development instead.`,
      );
      /* eslint-enable no-multi-str */
    }
    dotenv.config({ path: envPaths.development });
  }
};
