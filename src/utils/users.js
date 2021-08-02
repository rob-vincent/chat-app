const users = []

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()

  if (!username || !room) return { error: 'Username and room are required!' }

  const existingUser = users.find((user) => user.room === room && user.username === username)

  if (existingUser) return { error: 'Username is in use!' }

  const user = { id, username, room }
  users.push(user)
  return { user }
}

const removeUser = (id) => {
  // we can use filter method but it is slower than using findIndex
  const index = users.findIndex((user) => user.id === id)

  if (index !== -1) return users.splice(index, 1)[0]
}

const getUser = (id) => {
  return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room.trim().toLowerCase())
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
}
