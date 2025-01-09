const userName = localStorage.getItem('user_name');
const matricola = localStorage.getItem('user_id');

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'tutor') {
        window.location.href = '../login/index.html';
    }

    if (userName) {
        document.getElementById('greeting').textContent = `Benvenuto, ${userName}!`;
    }

    createCalendar('calendar', `http://peertopeer.martagenovese.com:5000/lezioni?matricolaP=${matricola}`);
    createCalendar('calendar-events', `http://peertopeer.martagenovese.com:5000/lezioni?matricolaP=${matricola}&matricolaT=%`);

    countLessons().then(([future, pastReserved]) => {
        document.getElementById('lessons-count').textContent = `Hai ${future} lezioni future`;
        document.getElementById('lessons-count-PASTReserved').textContent = `Hai tenuto ${pastReserved} lezioni`;
        document.getElementById('lessons-total').textContent = `Hai ${future + pastReserved} lezioni totali`;
        if (future + pastReserved >= 40) {
            document.getElementById('lessons-total').style.color = 'red';
            document.getElementById('calendar').style.pointerEvents = 'none';
        }
    });
});

function createCalendar(id, fetchUrl) {
    const calendarEl = document.getElementById(id);
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: (fetchInfo, successCallback, failureCallback) => {
            fetch(fetchUrl)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const events = data.map(event => ({
                            title: `${event.validata === 0 ? 'Richiesta' : ''} Lezione alle ${event.ora === 1 ? '13:40' : '14:30'}`,
                            start: new Date(event.data).toISOString(),
                            allDay: false,
                            matricolaP: matricola,
                            ora: event.ora,
                            data: event.data
                        }));
                        successCallback(events);
                    } else {
                        console.error('Unexpected response format:', data);
                        failureCallback(new Error('Unexpected response format'));
                    }
                })
                .catch(error => {
                    console.error('Error fetching events:', error);
                    failureCallback(error);
                });
        },
        selectable: true,
        selectAllow: (selectInfo) => {
            const now = new Date();
            now.setDate(now.getDate() + 2); // Two days ahead of the current date
            return selectInfo.start >= now;
        },
        dateClick: (info) => {
            if (id === 'calendar') {
                const now = new Date();
                now.setDate(now.getDate() + 1);
                if (info.date >= now) addLesson(info, calendar);
                else alert('Puoi dare disponibilità solo con almeno due giorni di anticipo.');
            }
        },
        eventClick: (info) => {
            if (info.event.extendedProps.matricolaP === matricola) removeLesson(info);
        }
    });
    calendar.render();
}

async function countLessons() {
    let future = 0;
    let pastReserved = 0;
    try {
        const response = await fetch(`http://peertopeer.martagenovese.com:5000/lezioni?matricolaP=${matricola}`);
        const data = await response.json();
        if (Array.isArray(data)) {
            data.forEach(event => {
                if (event.data >= new Date().toISOString().split('T')[0]) {
                    future++;
                } else if (event.matricolaT !== null) {
                    pastReserved++;
                }
            });
        } else {
            console.error('Formato inaspettato:', data);
        }
    } catch (error) {
        console.error('Errore durante il recupero delle lezioni:', error);
    }
    return [future, pastReserved];
}

function addLesson(info, calendar) {
    let turn = prompt('Dai disponibilità per il turno delle 13:40 o delle 14:30?\nInserisci "1" per le 13:40 o "2" per le 14:30:');
    turn = parseInt(turn);
    if (turn !== 1 && turn !== 2) {
        alert('Inserisci un valore valido (1 o 2).');
        return;
    }
    turn--;
    const turnText = turn ? '14:30' : '13:40';
    const eventTitle = `Richiesta Lezione alle (${turnText})`;

    fetch('http://peertopeer.martagenovese.com:5000/add_event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data: info.dateStr,
            matricolaP: matricola,
            ora: turn ? 1 : 2
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            calendar.addEvent({
                title: eventTitle,
                start: info.dateStr,
                allDay: false,
                matricolaP: matricola,
                ora: turn ? 1 : 2,
                nomecognP: userName
            });
            alert(`Lezione aggiunta: ${eventTitle}`);
        } else if (data.error === "Duplicate entry") {
            alert(`Hai già dato disponibilità per il turno delle ${turnText} per il giorno ${info.dateStr}.`);
        } else {
            alert(`Errore: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Errore:', error);
        alert('Si è verificato un errore. Riprova.');
    });
}

function removeLesson(info) {
    fetch('http://peertopeer.martagenovese.com:5000/lezioni', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matricolaP: matricola,
            data: info.event.start.toISOString().split('T')[0],
            ora: info.event.extendedProps.ora
        })
    })
    .then(response => response.json())
    .then(data => {
        const now = new Date();
        const eventDate = new Date(info.event.start);
        if (eventDate <= now) {
            alert('Puoi cancellare lezioni solo con almeno un giorno di anticipo.');
        } else if (data.message) {
            fetch(`http://peertopeer.martagenovese.com:5000/users?matricola=${info.event.extendedProps.matricolaP}`)
                .then(response => response.json())
                .then(data => {
                    if (data) {
                        const destinatari = [data.mailStudente, data.mailGenitore];
                        const dataLezione = info.event.start.toISOString().split('T')[0];
                        fetch(`http://peertopeer.martagenovese.com:5000/lezioni?matricolaP=${matricola}&data=${dataLezione}&ora=${info.event.extendedProps.ora}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.matricolaT) {
                                    fetch(`http://peertopeer.martagenovese.com:5000/users?matricola=${data.matricolaT}`)
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data) {
                                                destinatari.push(data.emailStudente, data.emailGenitore);
                                            }
                                        })
                                        .catch(error => {
                                            console.error('Errore durante il recupero dei dati dell\'utente', error);
                                        });
                                }
                            })
                            .catch(error => {
                                console.error('Errore durante il recupero delle lezioni:', error);
                            });
                        sendEmail(destinatari, info.event.extendedProps.materiaL, 'Lezione cancellata', `La lezione del ${info.event.start.toLocaleDateString()} alle ${info.event.extendedProps.ora === 1 ? '14:30' : '13:40'} è stata cancellata.`);
                    } else {
                        console.error('Errore durante la ricerca della mail. Formato inaspettato', data);
                    }
                })
                .catch(error => {
                    console.error('Errore durante il recupero dei dati dell\'utente', error);
                });

            alert('Lezione rimossa con successo');
            info.event.remove();
        } else {
            alert(`Errore: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Errore durante la rimozione della lezione', error);
        alert('Si è verificato un errore. Riprova.');
    });
}

async function sendEmail(recipient, subject, message) {
    // Uncomment and implement the email sending logic if needed
    // try {
    //     const response = await fetch('http://peertopeer.martagenovese.com:5000/send-email', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ recipient, subject, message })
    //     });

    //     const result = await response.json();

    //     if (response.ok) {
    //         alert('Email inviata con successo');
    //     } else {
    //         alert(`Error: ${result.error}`);
    //     }
    // } catch (error) {
    //     console.error('Errore durante l\'invio della mail', error);
    //     alert('Si è verificato un errore. Riprova.');
    // }
}