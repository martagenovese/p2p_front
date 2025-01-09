document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'admin') {
        window.location.href = '../login.html';
    }

    var calendarEl = document.getElementById('calendar');
    var unvalidatedEventsList = document.getElementById('unvalidated-events-list');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        events: function(fetchInfo, successCallback, failureCallback) {
            fetch('http://peertopeer.martagenovese.com:5000/lezioni')
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const events = data.map(event => ({
                            id: event.id,
                            title: `${event.validata === 0 ? 'Richiesta ' : ''}Lezione alle ${event.ora === 1 ? '13.40' : '14.30'}`,
                            start: new Date(event.data).toISOString(),
                            allDay: false,
                            matricolaP: event.matricolaP,
                            ora: event.ora,
                            validata: event.validata
                        }));
                        successCallback(events);

                        unvalidatedEventsList.innerHTML = '';

                        events.filter(event => event.validata === 0).forEach(event => {
                            const listItem = document.createElement('li');
                            const add = document.createElement('button');
                            add.textContent = 'Valida';
                            listItem.innerHTML = `<b>${event.title}</b>&nbsp da parte di &nbsp<b>${event.matricolaP}</b>&nbsp il giorno&nbsp <b>${event.start.split('T')[0]}</b>`;
                            listItem.dataset.eventId = event.id;

                            add.addEventListener('click', () => {
                                if (confirm(`Vuoi validare questa lezione: ${event.title}?`)) {
                                    fetch('http://peertopeer.martagenovese.com:5000/lezioni', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            matricolaP: event.matricolaP,
                                            data: event.start.toString().split('T')[0],
                                            ora: event.ora,
                                        })
                                    })
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.message) {
                                            alert('Lezione validata con successo');
                                            unvalidatedEventsList.removeChild(listItem);
                                            location.reload();
                                        } else {
                                            alert(`Errore: ${data.error}`);
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Errore durante la validazione della lezione', error);
                                        alert('Si è verificato un errore. Riprova.');
                                    });
                                }
                            });

                            listItem.appendChild(add);
                            unvalidatedEventsList.appendChild(listItem);
                        });

                        // Aggiungi la classe 'hasEvents' alle celle che hanno eventi
                        const eventDates = events.map(event => event.start.split('T')[0]);
                        const allCells = document.querySelectorAll('.fc-day');

                        allCells.forEach(cell => {
                            const cellDate = cell.getAttribute('data-date');
                            if (eventDates.includes(cellDate)) {
                                cell.classList.add('hasEvents');
                            } else {
                                cell.classList.remove('hasEvents');
                            }
                        });

                    } else {
                        failureCallback(new Error('Formato inaspettato'));
                    }
                })
                .catch(error => {
                    failureCallback(error);
                });
        },
        dateClick: function(info) {
            const existingModal = document.getElementById('event-modal');
            if (existingModal) {
                document.body.removeChild(existingModal);
                document.body.removeChild(document.getElementById('modal-overlay'));
            }

            const eventsForDay = calendar.getEvents().filter(event =>
                event.start.toISOString().split('T')[0] === info.dateStr
            );

            if (eventsForDay.length === 0) return;

            const overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            document.body.appendChild(overlay);

            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = new Date(info.dateStr).toLocaleDateString('it-IT', options);

            const modal = document.createElement('div');
            modal.id = 'event-modal';

            const modalHeader = document.createElement('h3');
            modalHeader.textContent = `Eventi del giorno ${formattedDate}`;
            modal.appendChild(modalHeader);

            const eventList = document.createElement('ul');
            eventsForDay.forEach(event => {
                const eventItem = document.createElement('li');
                eventItem.textContent = event.title;
                eventList.appendChild(eventItem);
            });
            modal.appendChild(eventList);

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Chiudi';
            closeButton.classList.add('close-modal');
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
                document.body.removeChild(overlay);
            });
            modal.appendChild(closeButton);

            document.body.appendChild(modal);
        }
    });

    calendar.render();
});