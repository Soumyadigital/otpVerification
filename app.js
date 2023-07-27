require("dotenv").config();
const express = require("express");
const app = express();
const hbs = require("hbs");
const fast2sms = require('fast-two-sms');
const crypto = require("crypto");
const smsKey = process.env.SMS_SECRET_KEY;
const cors = require('cors');
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.set("view engine","hbs");

app.get("/",(req,res)=>{
    res.render("index");
})

app.post("/messagesend",async(req,res)=>{
    const phone = req.body.number
    let otp = Math.floor(100000 + Math.random() * 10000000)
    const ttl = 2*64*100
    const expires = Date.now() + ttl
    const data = `${phone}.${otp}.${expires}`
    let hash = crypto.createHmac('sha256',smsKey).update(data).digest("hex")
    const fullhash = `${hash}.${expires}`
    // const options = {
    //     authorization : process.env.API_KEY ,
    //     message : `Your one time pasword is ${otp}` ,  
    //     numbers : [req.body.number]
    // } 
    // fast2sms.sendMessage(options) ;    
    var options = {
        authorization : process.env.API_KEY, 
        message : `Your one time pasword is ${otp}` ,
        numbers : [phone]
    } 
    await fast2sms.sendMessage(options) 
    await res.render("response",{ phone:phone, hash: fullhash }); 
})

app.post('/verifyOTP', (req, res) => {
	const phone = req.body.phone;
	const hash = req.body.hash;
	const otp = req.body.otp;
	let [ hashValue, expires ] = hash.split('.');

	let now = Date.now();
	if (now > parseInt(expires)) {
		return res.status(504).send('Timeout. Please try again');
	}
	const data = `${phone}.${otp}.${expires}`;
	let newCalculatedHash = crypto.createHmac('sha256', smsKey).update(data).digest('hex');

	if (newCalculatedHash === hashValue) {
        return res.status(201).send("user confirmed")
	} else {
		console.log('not authenticated');
		return res.status(400).send({ verification: false, msg: 'Incorrect OTP' });
	}
});



app.listen(PORT,()=>{
    console.log("Server is running on port 3000");
})