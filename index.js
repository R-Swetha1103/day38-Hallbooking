
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let rooms = [];
let bookings = [];

const isRoomBooked = (roomId, startTime, endTime) => {
  return bookings.some(booking => 
    booking.roomId === roomId && 
    ((startTime >= booking.startTime && startTime < booking.endTime) || 
     (endTime > booking.startTime && endTime <= booking.endTime) || 
     (startTime <= booking.startTime && endTime >= booking.endTime))
  );
};

app.post('/rooms', (req, res) => {
  const { roomName, seats, amenities, pricePerHour } = req.body;
  if (!roomName || !seats || !amenities || !pricePerHour) {
    return res.status(400).send('All fields are required');
  }
  const roomId = rooms.length + 1;
  rooms.push({ roomId, roomName, seats, amenities, pricePerHour });
  res.status(201).json({ roomId });
});

app.post('/bookings', (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;
  if (!customerName || !date || !startTime || !endTime || !roomId) {
    return res.status(400).send('All fields are required');
  }
  
  const room = rooms.find(r => r.roomId === roomId);
  if (!room) {
    return res.status(404).send('Room not found');
  }
  
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);
  
  if (isRoomBooked(roomId, startDateTime, endDateTime)) {
    return res.status(400).send('Room is already booked for this time slot');
  }
  
  const bookingId = bookings.length + 1;
  bookings.push({ bookingId, customerName, date, startTime, endTime, roomId });
  res.status(201).json({ bookingId });
});

app.get('/rooms', (req, res) => {
  const result = rooms.map(room => {
    const roomBookings = bookings.filter(b => b.roomId === room.roomId);
    return {
      ...room,
      bookings: roomBookings.map(b => ({
        bookedStatus: true,
        customerName: b.customerName,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime
      }))
    };
  });
  res.json(result);
});

app.get('/customers', (req, res) => {
  const result = bookings.map(b => {
    const room = rooms.find(r => r.roomId === b.roomId);
    return {
      customerName: b.customerName,
      roomName: room ? room.roomName : 'Unknown',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime
    };
  });
  res.json(result);
});

app.get('/bookings/customer/:customerName', (req, res) => {
  const { customerName } = req.params;
  const customerBookings = bookings.filter(b => b.customerName === customerName);
  
  const result = customerBookings.map(b => {
    const room = rooms.find(r => r.roomId === b.roomId);
    return {
      customerName: b.customerName,
      roomName: room ? room.roomName : 'Unknown',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      bookingId: b.bookingId
    };
  });
  
  res.json(result);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
