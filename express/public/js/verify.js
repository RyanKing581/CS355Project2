const codes = document.querySelectorAll('.code')

codes[0].focus()

codes.forEach((code, idx) => {
    code.addEventListener('keydown', (e) => {
        if(e.key >= 0 && e.key <= 9) {
            codes[idx].value = ''
            setTimeout(() => codes[idx + 1].focus(), 10)
        } else if(e.key === 'Backspace') {
            setTimeout(() => codes[idx - 1].focus(), 10)
        }
    })
})

document.getElementById('login').addEventListener('click', function() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Check if the inputs are valid
    if (username === '') {
        alert('Username is required');
    } else if (password === '') {
        alert('Password is required');
    } else if (password.length < 8) {
        alert('Password must be at least 8 characters long');
    } else {
        // If the inputs are valid, show the verification codes
        document.getElementById('verification').style.display = 'block';
    }
});