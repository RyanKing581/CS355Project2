document.getElementById('register-form').addEventListener('submit', function(event) {
  var username = document.getElementById('username').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  if (username === '') {
    alert('Username is required');
    event.preventDefault();
  } else if (email === '') {
    alert('Email is required');
    event.preventDefault();
  } else if (!emailRegex.test(email)) {
    alert('Please enter a valid email');
    event.preventDefault();
  } else if (password === '') {
    alert('Password is required');
    event.preventDefault();
  } else if (password.length < 8) {
    alert('Password must be at least 8 characters long');
    event.preventDefault();
  }
});