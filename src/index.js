const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  socket.on('join', (options, callback) => {
    // this socket.on('join') should be put on top to get access to socket.id
    // this is the reason why we return addUser as {user}
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) return callback(error)

    socket.join(user.room)

    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) // send a message to everyone
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    })

    callback()
  })

  // callback is an acknowledgement only
  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()
    const { username, room } = getUser(socket.id)

    if (filter.isProfane(message)) return callback('Profanity is not allowed!')

    // this is going to emit the event every single connection
    // instead of socket.emit
    io.to(room).emit('message', generateMessage(username, message))
    callback()
  })

  socket.on('sendLocation', ({ longitude, latitude }, callback) => {
    const { username, room } = getUser(socket.id)

    io.to(room).emit(
      'locationMessage',
      generateLocationMessage(username, `https://www.google.com/maps?q=${latitude},${longitude}`)
    )
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      // no need to use "broadcast" because user has already disconnected
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      })
    }
  })
})

// instead of app.listen()
server.listen(port, () => {
  console.log(`Server is up on port ${port}`)
})
