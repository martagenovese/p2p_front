const userName = localStorage.getItem('user_name');
const matricola = localStorage.getItem('user_id');

document.addEventListener('DOMContentLoaded', () => {

    if (userName) {
        displayGreeting(userName);
    }

    createCalendar(matricola, 'http://peertopeer.martagenovese.com:5000/lezioni?matricolaT=');
    const upLessons = document.getElementById('upcoming-events-list');
    loadUpcomingLessons(upLessons);
});

function isUserLoggedIn() {
    return localStorage.getItem('logged_in') === 'true' && localStorage.getItem('user_type') === 'tutee';
}

function redirectToLogin() {
    window.location.href = '../login/index.html';
}

function displayGreeting(userName) {
    document.getElementById('greeting').textContent = `Welcome, ${userName}!`;
}

function createCalendar(matricola, fetchUrl) {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: (fetchInfo, successCallback, failureCallback) => {
            fetchEvents(fetchUrl + matricola, successCallback, failureCallback);
        },
        eventClick: (info) => {
            handleEventClick(matricola, info);
        }
    });

    calendar.render();
}

function fetchEvents(url, successCallback, failureCallback) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                const events = data.map(event => ({
                    id: event.id,
                    title: `Lezione alle ${event.ora === 1 ? '13.40' : '14.30'}`,
                    start: new Date(event.data).toISOString(),
                    allDay: false,
                    matricolaP: event.matricolaP,
                    matricolaT: event.matricolaT,
                    ora: event.ora,
                    validata: event.validata
                }));
                successCallback(events);
            } else {
                handleUnexpectedResponse(data, failureCallback);
            }
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            failureCallback(error);
        });
}

function handleUnexpectedResponse(data, failureCallback) {
    console.error('Unexpected response format:', data);
    failureCallback(new Error('Unexpected response format'));
}

function handleEventClick(matricola, info) {
    if (confirm(`Do you want to remove this reservation: ${info.event.title}?`)) {
        removeEvent(matricola, info);
    }
}

function removeEvent(matricola, info) {
    fetch('http://peertopeer.martagenovese.com:5000/lezioni', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matricolaT: matricola,
            data: info.event.start.toISOString().split('T')[0],
            ora: info.event.extendedProps.ora,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Reservation removed successfully');
            info.event.remove();
        } else {
            alert(`Error: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error removing reservation:', error);
        alert('An error occurred. Please try again.');
    });
}

function loadUpcomingLessons(upLessons) {
    fetch(`http://peertopeer.martagenovese.com:5000/lezioni?matricolaT=${matricola}`)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                const lessons = data.map(lesson => {
                    const li = document.createElement('li');
                    li.textContent = `Lezione con ${lesson.matricolaP} il ${lesson.data} alle ${lesson.ora === 1 ? '13.40' : '14.30'} su ${lesson.materiaL}: ${lesson.argomenti}`;
                    return li;
                });
                lessons.forEach(lesson => upLessons.appendChild(lesson));
            } else {
                console.error('Unexpected response format:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching upcoming lessons:', error);
        });
}