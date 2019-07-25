const crypto = require('crypto');
const is_email_valid = require('../../utils/isEmailValid');

const ITERATIONS = 10;
const LENGTH = 128;
const PRIVATE_FIELDS = ['salt', 'password_hash', 'hash'];
const PROFILE_FIELDS = ['email', 'login', 'user_id'];
const BILLING_FIELDS = [
  'first_name',
  'last_name',
  'middle_name',
  'billing_id',
  'user_id',
  'phone',
  'shipping_address',
];

async function generate_hash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password, salt,
      ITERATIONS, LENGTH,
      'sha512',
      (err, key) => {
        if (err) return reject(err);
        resolve(key.toString('hex'));
      },
    );
  });
}

function generate_salt() {
  return crypto.randomBytes(LENGTH).toString('hex');
}

function validate_data(props) {
  const {
    email = '',
    password = '',
  } = props;

  if (!is_email_valid(email)) {
    throw new Error('Невалидный email');
  }

  if (password && (password.length < 4)) {
    throw new Error('Пароль должен быть минимум 4 символа.');
  }
}

async function create_user(props) {
  validate_data(props);

  const user_fields = { ...props };
  user_fields.salt = generate_salt();
  user_fields.hash = await generate_hash(user_fields.salt, props.password);

  return user_fields;
}

async function is_same_user(model_hash, salt, password) {
  if (!password) return;

  const hash = await generate_hash(salt, password);
  return model_hash === hash;
}

function get_user_fields(user = {}) {
  const nextUser = {};
  Object.keys(user).forEach(key => {
    if (PRIVATE_FIELDS.includes(key)) return;
    nextUser[key] = user[key];
  });

  return nextUser;
}

module.exports = {
  create_user,
  is_same_user,
  get_user_fields,
  generate_hash,
  PROFILE_FIELDS,
  BILLING_FIELDS,
};
