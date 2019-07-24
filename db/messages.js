
module.exports = function derive_message(e) {
  const { constraint } = e;
  if (constraint === 'users_email_key') {
    return {
      status: 'error',
      message: 'Email уже существует. Пожалуйста, выберите новый'
    }
  }

  if (constraint === 'users_login_key') {
    return {
      status: 'error',
      message: 'Логин уже существует. Пожалуйста, придумайте новый'
    }
  }
}
