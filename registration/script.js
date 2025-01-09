async function handleRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const domain = data.mail.split('@')[1];
    if (domain !== 'studenti.marconiverona.edu.it') {
        alert('Registrati con la tua email istituzionale');
        return;
    }

    try {
        const userResponse = await fetch('http://peertopeer.martagenovese.com:5000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const tuteeResponse = await fetch('http://peertopeer.martagenovese.com:5000/tutees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricola: data.matricola, passw: data.password })
        });

        const userResult = await userResponse.json();
        const tuteeResult = await tuteeResponse.json();

        if (userResponse.ok && tuteeResponse.ok) {
            alert('Registration successful!');
            localStorage.setItem('user_name', `${data.nome} ${data.cognome}`);
            localStorage.setItem('user_type', 'tutee');
            localStorage.setItem('user_id', data.matricola);
            localStorage.setItem('logged_in', 'true');
            window.location.href = '../tutee/index.html';
        } else {
            const errorMessage = userResult.error || tuteeResult.error || 'An error occurred during registration.';
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration.');
    }
}