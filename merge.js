// import fs from 'fs';
const fs = require("fs");

try {
  let data = fs.readFileSync("./source/1/message.txt", "utf-8");
  //console.log(data);
  if (data) {
    const result = [];
    data = data.split("\r\n")
    const length = data.length;
    console.log("length : " + length);
    for (let i = 0; i < length; i++) {
      result.push(data[i]);
    }
    //console.log(result);
    console.log("length : " + result.length);
    fs.writeFile("./source/message.txt", JSON.stringify(result, null, 2), function(err) {
    // fs.writeFile("./source/message.txt", JSON.stringify(result), function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
} catch (e) {
  console.log(e);
}
