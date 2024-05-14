const isLoggedIn = false;

document.getElementById('loginButton').href = '../public/login.html';

document.getElementById('loginButton').addEventListener('click', function() {
    if (isLoggedIn) {
        // Log the user out
        fetch('/logout')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    isLoggedIn = false;
                    loginButton.textContent = 'Login';
                    loginButton.href = '../public/login.html'; // Point to your actual login page
                    alert(data.message);
                }
            });
    } else {
        // Redirect the user to the login page
        window.location.href = loginButton.href;
    }
});