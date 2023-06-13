//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
//--1--
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3000;


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//--2-- CONNECTION to Database
mongoose.connect("mongodb+srv://victimcoin:WFVHhaSAbBeZLBwU@cluster0.zetd24p.mongodb.net/todolistDB");

//--3-- SCHEMA Create a new schema
const itemSchema = {
  name : String
}

//--4-- MODEL Create a new mongoose model based on the created schema.
//const ModelName = mongoose.model("SingularCollectionName", schemaName);
const Item = mongoose.model("Item", itemSchema);


//--5-- DOCUMENT Create new documents and an array
//const <constantName> = new <ModelName> ({<fieldName> : <fieldData>, ... });
const item1 = new Item ({name : "Welcome to the todo list"});

const item2 = new Item ({name : "Hit the + button to add a new item"});

const item3 = new Item ({name : "<-- Hit this to delete an item"});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


//--6-- Use insertMany for adding
//  Item.insertMany(defaultItems)
// .then(() =>{
//     console.log("Successfully saved all the items to todolistDB");
// })
// .catch((error) => {
//     console.log(error)
// });
//Do not forget the mongod in your terminal


app.get("/", function(req, res) {
  
  Item.find({}).then(foundItems => {
    if (foundItems.length === 0) {
        Item.insertMany(defaultItems).then(function(){
        console.log("Successfully saved all the items to todolistDB");
    })
        .catch(function(error) {
         console.log(error);
        });
        res.redirect("/");
      }else{res.render("list", {listTitle:"Today", newListItems: foundItems});
    }
    
  })
  
  .catch(err => {
    console.error(err);
  });
  
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName})
  .then(foundList=> {
    if(!foundList){
      
      const list = new List({
      name : customListName,
      items : defaultItems
      });

      list.save();
      res.redirect("/"+customListName);
    } else {
    res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
  }
})
  .catch(err =>{
    console.log("Doesn't Exist");
  });
});

// // New Syntax
// Model.findOne({ condition })
//   .then(result => {
//     // Code for handling the result
//   })
//   .catch(err => {
//     // Code for handling errors
//   });


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");  
  } else {
    List.findOne({name:listName}).then(foundList =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName=req.body.listName;

  if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId).then (function(err){
        if(!err){
          console.log(checkedItemId+" removed");
        }
        res.redirect("/");    
    });
  } else {
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
    .then(function(err, foundList){
      if(!err){
        console.log("Successfully deleted checked item.");
      }
      res.redirect("/" + listName);
    });
  }


});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

const server = app.listen(port, () => console.log("Server started on port ${port}"));

server.keepAliveTimeout=120*1000;
server.headersTimeout=120*1000;
