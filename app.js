const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
app.use(express.json())
const dBpath = path.join(__dirname, 'userData.db')
let database = null
const initilizeDbAndServer = async () => {
  try {
    database = await open({
      filename: dBpath,
      driver: sqlite3.Database,
    })
    app.listen(3001, () =>
      console.log('server Running at http://localhost:3000'),
    )
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initilizeDbAndServer()

const validatepassword = password => {
  return password.length > 4
}
//POST METHOD 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = ${username};`
  const databaseUser = await database.run(selectUserQuery)

  if (databaseUser == undefined) {
    const creatUserQury = `
    INSERT INTO 
      user (username,name,password,gender,location)
    VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    );`
    if (validatepassword(password)) {
      await database.run(creatUserQury)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exits')
  }
})
//POST METHOD 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = ${username};`
  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser == undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatchd = await bcrypt.compare(password, database.password)
    if (isPasswordMatchd == true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
//PUT METHOD 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = ${username};`
  const databaseUser = await database.get(selectUserQuery)
  if (databaseUser == undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatched == true) {
      if (validatepassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE
         user
        SET 
          password = '${hashedPassword}'
        WHERE
          username = '${username}';`

        const user = await database.run(updatePasswordQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
