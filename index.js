const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { verify } = require("crypto");

let app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("Hello From Express");
});

mongoose
  .connect(
    "mongodb+srv://kartic3289:nvrdiedeckay@cluster0.ojwudnf.mongodb.net/medium",
    {}
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error Connecting to MongoDB " + error);
  });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Name is Required"],
    unique: [true, "Name is already taken"],
  },
  email: {
    type: String,
    required: [true, "Email is Required"],
    unique: [true, "Email is already taken"],
  },
  password: {
    type: String,
    required: [true, "Password is Required"],
  },
});
const User = mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is Required"],
  },
  date: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, "Content is Required"],
  },
});
const Post = mongoose.model("Post", postSchema);

app.post("/api/v1/user/signup", (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });
  newUser.save()
    .then((user) => {
      const jwttoken = jwt.sign({ userId: user._id }, "secret");
      res.status(201).json({
        message: "User Created Successfully",
        user: user,
        jwt: jwttoken,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "An error occurred while creating the user",
        error: error.message
      });
    });
});

app.post("/api/v1/user/signin", (req, res) => {

  console.log(req.body);
  email =  req.body.email;
  password = req.body.password;
  
  console.log("email",email);
  console.log("password",password);

  User.findOne({email: email})
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const validPassword = user.password === password;
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      } else {
        const jwttoken = jwt.sign({ userId: user._id }, "secret");
        res.status(200).json({
          message: "User Logged Successfully",
          user: user,
          jwt: jwttoken,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "An error occurred while Login",
        error: error.message
      });
    });
});

app.get("/api/v1/blog/post/all", async (req,res)=>{

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(' ')[1];
  verifyToken = jwt.verify(token,"secret");
  if(!verifyToken){
    return res.status(401).json({ message: "Unauthorized" });
  }else{
    const posts = await Post.find().populate('author');
    res.status(200).json({
      message: "Fetched all posts successfully",
      posts: posts,
  });
}
})

app.post("/api/v1/blog/post/add", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = authHeader.split(' ')[1];
    const verifyToken = jwt.verify(token, "secret");
    if (!verifyToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
 
    let user = User.findById(verifyToken.userId);
    if(!user){
      return res.status(404).json({ message: "Invalid user" });
    }

    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      author: verifyToken.userId
    });
    await newPost.save(); 

    return res.status(200).json({ message: "Blog Added Successfully" });
  } catch (error) {
    console.error("Error adding blog post:", error);
    return res.status(500).json({ message: "Failed to add blog post", error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running");
});
