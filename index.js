const app = require("./app");
const user = require("./user");

user.init().then(() => app.listen(3001));