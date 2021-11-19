const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({ username: { $ne: 'test' } })

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

test('can be created with new username', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'qwerty',
    name: 'PR',
    password: '1qaz',
  }

  await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', '/application/json/');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
})

test('creation will fail with correct statuscode if username is already taken', () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'root',
    name: 'Superuser',
    password: 'salainen',
  }
  
  const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', '/application/json/')

  expect(result.body.error).toContain('username must be unique')

  const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
})

test('username shorter than three characters', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'k',
    name: 'sdbhnjkfbskjdbgflkjsnbf',
    password: 'salainen',
  }
  
  await api.post('/api/users').send(newUser).expect(400)

  const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  
})

test('password shorter than three characters', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'jsdngfjndsj',
    name: 'bjsakdfgbdskb',
    password: 'g',
  }

  await api.post('/api/users').send(newUser).expect(404)

  const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
})

})