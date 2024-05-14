const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const BlogPost = require('./postuserblog');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:37017/blog', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/submit-blog-post', (req, res) => {
    const { title, author, date, content } = req.body;

    const newBlogPost = new BlogPost({
        title,
        author,
        date,
        content
    });

    newBlogPost.save()
        .then(() => res.status(200).send('Blog post saved successfully!'))
        .catch(err => res.status(400).send('Unable to save blog post.'));
});

app.listen(3000, () => console.log('Server started on port 3000'));