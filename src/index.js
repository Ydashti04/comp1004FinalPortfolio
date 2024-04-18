const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const knex = require('knex')(require('./knexfile'));
const owasp = require('owasp-password-strength-test');
const path = require('path');

const cookieData = { path: '/', sameSite: 'Strict', httpOnly: true }
const publicPath = path.join(__dirname, '..', 'public')
const app = express();
const port = 3000;
const saltRounds = 10;


function resError(res, code, message, error="error") {
    return res.status(code).json({ status: error, message: message });
}

function resSuccess(res, message) {
    return res.json({ status: 'success', message: message });
}


owasp.config({
    allowPassphrases       : true,
    maxLength              : 128,
    minLength              : 10,
    minPhraseLength        : 20,
    minOptionalTestsToPass : 4,
});

owasp.tests.required = [
    function(password) {
        if (password.match(/[a-z]/)) {
            return;
        }
        return "The password must include at least one lowercase letter.";
    },
    function(password) {
        if (password.match(/[A-Z]/)) {
            return;
        }
        return "The password must include at least one uppercase letter.";
    },
    function(password) {
        if (password.match(/\d/)) {
            return;
        }
        return "The password must include at least one number.";
    },
    function(password) {
        if (password.match(/[\!\@\#\$\%\^\&\*\(\)\_\+\-\=\[\]\{\}\;\:\'\"\\|,\<\>\/\?]/)) {
            return;
        }
        return "The password must include at least one special character.";
    }
];







app.use(bodyParser.json());
app.use(cookieParser());

function ensureAuthenticated(req, res, next) {
    if (!('userId' in req.cookies)) {
        res.redirect('/login.html');
    } else {
        next();
    }
}


app.use('/notes.html', ensureAuthenticated, express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'public')));


app.get('/', (req, res) => {
    if ('userId' in req.cookies) {
        res.redirect('/notes');
    } else {
        res.redirect('/login.html');
    }
});




// redirects the user to log in if they are not.
app.get('/notes', (req, res) => {
    if (!('userId' in req.cookies)) {
        res.redirect('/login.html');
    } else {
        res.sendFile(path.join(publicPath, 'notes.html'));
    }
});



// This handles getting a list of all notes (loadNotes)
app.get('/api/notes', (req, res) => {
    if (!('userId' in req.cookies)) {
        return resError(res, 401, 'Unauthorized access');
    }

    return knex('notes')
        .select('*')
        .where({user_id: req.cookies['userId']})
        .then(notes => {
            console.log(notes)
            res.json(notes)
        })
        .catch(err => resError(res, 510, 'Error retrieving notes', err));
});


// This handles adding a new note
app.post('/api/notes', (req, res) => {
    if (!('userId' in req.cookies)) {
        return resError(res, 401, 'Unauthorized access');
    }
    const { title, content } = req.body;
    if (title === "") {
        return resError(res, 511, 'Note needs a title')
    }
    if (content === "") {
        return resError(res, 512, 'Note needs content')
    }

    const userId = req.cookies.userId['id'];
    console.log(userId, title, content)
    knex('notes').insert({
        user_id: userId,
        title: title,
        content: content
    })
        .then(() => res.status(201).json({ message: 'Note added successfully' }))
        .catch(err => resError(res, 513, 'Failed to add note', err));
});


// This handles updating an existing note
app.put('/api/notes/:id', (req, res) => {
    if (!('userId' in req.cookies)) {
        return resError(res, 401, 'Unauthorized access');
    }
    const noteId = req.params.id;
    const { title, content } = req.body;
    const userId = req.cookies['userId'];

    return knex('notes')
        .where({ id: noteId, user_id: userId })
        .update({ title, content })
        .then(() => res.status(200).json({ status: "success", message: 'Note updated successfully' } ))
        .catch(err => resError(res, 514, 'Failed to update', err));
});


// This handles deleting a note
app.delete('/api/notes/:id', (req, res) => {
    if (!('userId' in req.cookies)) {
        return resError(res, 401, 'Unauthorized access');
    }
    return knex('notes')
        .where({ id: req.params.id, user_id: req.cookies['userId'] })
        .del()
        .then(() => res.json({ message: 'Note deleted successfully' }))
        .catch(err => resError(res, 515, 'Failed to delete note', err));
});


app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    let result = owasp.test(password);
    if (result.errors.length) {
        return resError(res, 400, result.errors[0]);
    }
    if (password.length < 10) {
        return resError(res, 400, "The password must be at least 10 characters long.");
    }

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        const [userId] = await knex('users').insert({ username, password: hash }).returning('id');
        res.cookie('userId', userId, cookieData);
        resSuccess(res, 'you have logged in!');
        res.code = 201
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('duplicate key value')) {
            resError(res, 409, 'Username is already taken' );
        } else {
            resError(res, 516, 'Error registering user');
        }
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await knex('users').select('id', 'password').where({ username }).first();
        if (!user) {
            return resError(res, 401, 'Invalid credentials');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.cookie('userId', user.id, cookieData);
            resSuccess(res, 'Login successful')
            res.code = 201
        } else {
            resError(res, 401, 'Invalid credentials');
        }
    } catch (error) {
        resError(res, 500, 'Internal server error');
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
