module.exports = {
  "parser": "babel-eslint",
  "extends": "airbnb-base",
  "env": {
    "node": true,
    "commonjs": true,
    "es6": true
  },
  "plugins": [
    "import"
  ],
  "rules": {
    "max-len": ["warn", {
      "code": 60,
      "ignoreComments": true,
      "tabWidth": 2
    }],
    "arrow-parens": ["error", "as-needed"],
    "no-console": "off",
    "no-else-return": "off",
    "no-plusplus": "off",
    "no-use-before-define": ["error", {"functions": false}],
    "object-curly-newline": "off",
    "operator-linebreak": ["error", "after"]
  }
};
