const password = document.getElementById('password');
const passwordStrength = document.getElementById('password-strength');

password.addEventListener('input', (e) => {
    const input = e.target.value;
    const length = input.length;
    let strength = length * 10;
    // Limit the strength to 100
    strength = Math.min(strength, 100);
    passwordStrength.style.width = `${strength}%`;
});