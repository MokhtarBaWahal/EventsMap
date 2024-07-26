
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [0, 0],
  zoom: 2
});

const yearInput = document.getElementById('year');
yearInput.addEventListener('change', updateMap);

const showFormBtn = document.getElementById('show-form-btn');
const eventForm = document.getElementById('event-form');
let addingEvent = false;

showFormBtn.addEventListener('click', () => {
  eventForm.style.display = eventForm.style.display === 'none' ? 'block' : 'none';
  addingEvent = !addingEvent;
  if (addingEvent) {
    map.getCanvas().classList.add('add-event-cursor');
  } else {
    map.getCanvas().classList.remove('add-event-cursor');
  }
});

const form = document.getElementById('new-event-form');
form.addEventListener('submit', addEvent);

map.on('click', function(e) {
  if (addingEvent) {
    const coordinates = e.lngLat;
    document.getElementById('event-coordinates').value = `${coordinates.lng},${coordinates.lat}`;
    map.getCanvas().classList.remove('add-event-cursor');
    addingEvent = false;
    eventForm.style.display = 'block';
  }
});

function updateMap() {
  const year = yearInput.value;

  fetch(`/events/${year}`)
    .then(response => response.json())
    .then(events => {
      // Clear existing markers
      document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

      events.forEach(event => {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <h3>${event.title}</h3>
          <p>${event.description}</p>
          <img src="${event.image}" alt="${event.title}" style="width: 100%;">
        `);

        new mapboxgl.Marker()
          .setLngLat(event.coordinates)
          .setPopup(popup)
          .addTo(map);
      });
    });
}

function addEvent(event) {
  event.preventDefault();

  const year = document.getElementById('event-year').value;
  const title = document.getElementById('event-title').value;
  const description = document.getElementById('event-description').value;
  const coordinates = document.getElementById('event-coordinates').value.split(',').map(Number);
  const image = document.getElementById('event-image').value;

  const newEvent = {
    year: parseInt(year),
    title,
    description,
    coordinates,
    image
  };

  fetch('/add_event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newEvent)
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      updateMap();
      form.reset();
      eventForm.style.display = 'none';  // Hide the form after submission
    }
  });
}

// Initial load
updateMap();