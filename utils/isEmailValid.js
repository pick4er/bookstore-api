
module.exports = function is_email_valid(email) {
  return /^[-.\w]+@([\w-]+\.)+[\w-]{2,12}$/.test(email);
}
