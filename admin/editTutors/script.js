document.addEventListener('DOMContentLoaded', () => {
    // Check login
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'admin') {
        window.location.href = '../login.html';
    }

    const tutorsTableBody = document.querySelector('#tutors-table tbody');

    // Fetch tutors
    fetch('http://peertopeer.martagenovese.com:5000/tutors')
        .then(response => response.json())
        .then(data => {
            data.forEach(tutor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tutor.matricola}</td>
                    <td>${tutor.nome}</td>
                    <td>${tutor.cognome}</td>
                    <td>${tutor.classe}</td>
                    <td><button class="delete-button">Elimina</button></td>
                `;
                row.querySelector('.delete-button').addEventListener('click', () => handleDeleteTutor(tutor.matricola, row));
                tutorsTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching tutors:', error));

    // Modal handling
    const modal = document.getElementById('add-tutor-modal');
    const openModalButton = document.getElementById('open-add-tutor-modal');
    const thead = document.getElementById('thead');

    openModalButton.addEventListener('click', () => {
        modal.style.display = 'flex'
        thead.style.position = 'static'
        modal.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.target === modal) {
                modal.style.display = 'none';
                modal.onclick = null;
                thead.style.position = 'sticky'
            }
        }
        }
    );

    // Add tutor
    document.getElementById('add-tutor-button').addEventListener('submit', handleAddTutor);
});

function handleDeleteTutor(matricola, row) {
    if (confirm('Sei sicuro di voler eliminare questo tutor?')) {
        fetch('http://peertopeer.martagenovese.com:5000/tutors', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricola })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Tutor eliminato con successo');
                row.remove();
            } else {
                alert(`Errore: ${data.error}`);
            }
        })
        .catch(error => alert('Errore durante la rimozione del tutor.'));
    }
}

function handleAddTutor() {
    console.log('add tutor');
    const form = document.getElementById('add-tutor');
    const formData = new FormData(form);
    console.log(Object.fromEntries(formData));
    fetch('http://peertopeer.martagenovese.com:5000/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Tutor aggiunto con successo');
            location.reload();
        } else {
            alert(`Errore: ${data.error}`);
        }
    })
    .catch(error => alert('Errore durante l\'aggiunta del tutor.'));
}