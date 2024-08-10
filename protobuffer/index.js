const schema = require("./user_pb");

const din = new schema.User();
din.setId(1)
din.setName("din")
din.setAge(23)

const xiao = new schema.User();
xiao.setId(1);
xiao.setName("xiao");
xiao.setAge(23);

const users = new schema.Users();
users.addUser(din);
users.addUser(xiao);

const bytes = users.serializeBinary();
const toUser = schema.Users.deserializeBinary(bytes);

console.log(toUser.getUserList()[0].getName());

