document.getElementById('loginButton').addEventListener('click', function() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(result => {
            if (result.status !== 200) {
                throw new Error(result.body.message || 'Login failed');
            }
            alert('Login Successful: ' + result.body.message);
            window.location.href = '/notes';
        })
        .catch(error => {
            console.error('Error during login:', error);
            alert('Login failed: ' + error.message);
        });
});

document.getElementById('signupButton').addEventListener('click', function() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    })
        .then(response => response.json().then(data => ({ code: response.status, body: data })))
        .then(result => {
            if (result.code === 200 || result.code === 201) {
                alert('Signup Successful: ' + result.body.message);
                window.location.href = '/notes';
            } else {
                throw new Error('Signup failed: ' + result.body.message);
            }
        })
        .catch(error => {
            console.error('Error during signup:', error);
            alert(error.message);
        });
});
