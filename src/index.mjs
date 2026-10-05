import express from "express";
import routes from "./routes/router.mjs"
import mongoose from "mongoose";
import 'dotenv/config';

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
.then(()=>console.log("DB Connected"))
.catch((err)=>console.log(`Error: ${err}`));

app.use(routes);

const PORT = 3000;

app.get("/", (req, res)=>{
    res.send({msg: "Root"});
});

app.listen(PORT, ()=>{
    console.log(`App is running on Port ${PORT}`);
});
