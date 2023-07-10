const express = require("express");
const path = require("path");
const app = express();

app.set("views", path.join(__dirname, "views"));
// Set EJS as the template engine
app.set("view engine", "ejs");
// mail.ejs render to /submitform
app.get("/file", (req, res) => {
    res.render('index');
});

// app.get("/hello",(req,res)=>{
//     res.sendFile(path.join(__dirname,'index.ejs'))
// })
app.listen(3001, () => {
  console.log("server connected");
});
