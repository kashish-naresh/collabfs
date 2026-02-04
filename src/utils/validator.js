// client-cli/src/utils/validator.js

module.exports = {
  isValidRoomId(id) {
    return typeof id === "string" && id.length >= 4;
  },
};
