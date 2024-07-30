mapboxgl.accessToken = 'pk.eyJ1IjoibW9raHRhcnNhbGVtcyIsImEiOiJjbHoybmhwYWwzMGZuMmlxc2tpaDhlNmkzIn0.3B1q00jaaxe2IsYm0icQlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 0],
  zoom: 2
});


map.on('load', () => {
  // Change the water color
  map.setPaintProperty('water', 'fill-color', '#41b6c4'); // Customize this color to your preference

  // Change the land color
  map.setPaintProperty('land', 'background-color', '#e6e6e6'); // Customize this color to your preference
});

const yearSlider = document.getElementById('year-slider');
const yearInput = document.getElementById('year-input');

yearSlider.addEventListener('input', updateMap);
yearInput.addEventListener('input', updateMap);

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
    eventForm.style.display = 'block';
  }
});

function updateMap() {
  const year = yearSlider.value;

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

  addingEvent = false;
}

// Initial load
updateMap();