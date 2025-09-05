module.exports = {
  isValidRoomId(id) {
    return typeof id === "string" && id.length >= 4;
  },
};
