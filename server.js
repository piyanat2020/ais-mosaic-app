// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ตั้งค่าที่เก็บไฟล์รูปภาพ
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        // ตั้งชื่อไฟล์เป็น timestamp ตามด้วยนามสกุลเดิม
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// เปิดให้เข้าถึงไฟล์ใน folder public ได้
app.use(express.static('public'));

// เก็บรายการรูปภาพทั้งหมดใน Memory (เริ่มต้น)
let imageList = [];

// API สำหรับรับรูปภาพจาก User
app.post('/upload', upload.single('photo'), (req, res) => {
    if(req.file){
        const imgUrl = `/uploads/${req.file.filename}`;
        imageList.push(imgUrl);
        
        // ส่งสัญญาณบอกทุกหน้าจอว่ามีรูปใหม่มา (New Image Event)
        io.emit('newImage', imgUrl);
        
        res.send('Upload Success');
    } else {
        res.status(400).send('Error Uploading');
    }
});

// เมื่อมีคนเชื่อมต่อ Socket
io.on('connection', (socket) => {
    console.log('New client connected');
    // ส่งรายการรูปภาพที่มีอยู่แล้วทั้งหมดไปให้คนที่เพิ่งเข้ามา
    socket.emit('initImages', imageList);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
