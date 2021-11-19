const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')

beforeEach(async () => {
  await Blog.deleteMany({})
  
  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog);
    await blogObject.save()}
})

describe('when there is initially some blogs saved', () => {
  
  test('blogs are returned as json', async () => {
    await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  })

  test('there are right amount of blogs', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('a specific title is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const contents = response.body.map((r) => r.content)
    expect(contents).toContain(('my new blog')
    )
  })
})

describe('viewing a specific blog', () => {

  test('blog has a unique name', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
  })

  test('spesific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb();
      const blogToView = blogsAtStart[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

    expect(resultBlog.body).toEqual(processedBlogToView)
  })

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId();

    await api.get('/api/blogs/${validNonexistingId}').expect(404);
  })

  test('fails with statuscode 400 id is invalid', async () => {
    const invalidId = '5a422a851b54a674976d17f7'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)
  })
})


describe('addition of a new blog', () => {

  let token = null;
  beforeAll(async () => {
    await User.deleteMany({});

    const testUser = await new User({
      username: 'qwerty',
      passwordHash: await bcrypt.hash('1qaz', 10),
    }).save();

    const userForToken = { username: 'qwerty', id: testUser.id };
    token = jwt.sign(userForToken, process.env.SECRET);
    return token;
  })

  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'new blog',
      author: 'PR',
      url: 'newBlog.net',
      likes: 77,
      userId: '5a422a851b54a676234d17f7',
    }
  
    await api
    .post('/api/blogs')
    .set('Authorization', 'Bearer ${token}')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

    const blogsAfterAdding = await helper.blogsInDb();

    const contents = blogsAfterAdding.map((blog) => blog.title);
    expect(contents).toContain('A Brilliant Blog');

    expect(blogsAfterAdding).toHaveLength(helper.initialBlogs.length + 1);
  })

  test('if request has no likes property likes are set to 0', async () => {
    const newBlog = {
      title: 'new blog1',
      author: 'RR',
      url: 'newBlog1.net',
      likes: 69,
      userId: '5a422a851b54a676234d17f7',
    }

    await api
    .post('/api/blogs')
    .set('Authorization', 'Bearer ${token}')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

    const blogsAfterAdding = await helper.blogsInDb();

    const likesOfAdedBlog = blogsAfterAdding[blogsAfterAdding.length - 1].likes;

    expect(likesOfAdedBlog).toBe(0);
  })

  test('if request has no title and url properties -> 400 Bad Request', async () => {
    const newBlog = {
      author: 'GH',
      likes: 6,
      userId: '5a422a851b54a676234d17f7',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ${token}')
      .send(newBlog)
      .expect(400);
  })


  test('blog without content is not added', async () => {
    const newBlog = { userId: '5a422a851b54a676234d17f7' };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ${token}')
      .send(newBlog)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  })

})

describe('deletion of a blog', () => {
  let token = null
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const testUser = await new User({
      username: 'qwerty',
      passwordHash: await bcrypt.hash('1qaz', 10),
    }).save()

    const userForToken = { username: 'qwerty', id: testUser.id }
    token = jwt.sign(userForToken, process.env.SECRET)

    const newBlog = {
      title: 'random blog',
      author: 'FHGF',
      url: 'randomBlog.com',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ${token}')
      .send(newBlog)
      .expect(200);

    return token;
  });

  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete('/api/blogs/${blogToDelete.id}')
      .set('Authorization', 'Bearer ${token}')
      .expect(204);
    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(0)

    const contents = blogsAtEnd.map((r) => r.title)

    expect(contents).not.toContain(blogToDelete.title)
  })
})

describe('updating of a blog', () => {

  test('blog can be updated', async () => {
    const newBlog = {
      title: 'joulupukki',
      author: 'ACF',
      url: 'jouluonkohta.net',
      likes: 9567,
    }

    const initialBlogs = await helper.blogsInDb();
    const blogToUpdate = initialBlogs[0];

    await api.put('/api/blogs/${blogToUpdate.id}').send(newBlog).expect(200);

    const blogsAfterUpdating = await helper.blogsInDb();

    const updatedBlog = blogsAfterUpdating[0];

    expect(blogsAfterUpdating).toHaveLength(helper.initialBlogs.length);

    expect(updatedBlog.likes).toBe(2000);
    expect(updatedBlog.author).toBe('joulupukki')
  })
})

afterAll(() => {
  mongoose.connection.close()
})