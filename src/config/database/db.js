"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var db = new client_1.PrismaClient();
db.$connect()
    .then(function (db) {
    console.log("DB connected ", db);
}).catch(function (e) {
    console.log("DB error connection ", e);
});
exports.default = db;
