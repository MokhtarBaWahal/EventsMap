mapboxgl.accessToken = 'pk.eyJ1IjoibW9raHRhcnNhbGVtcyIsImEiOiJjbHoybmhwYWwzMGZuMmlxc2tpaDhlNmkzIn0.3B1q00jaaxe2IsYm0icQlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 0],
  zoom: 3
});

var currentTime = new Date()

map.on('load', () => {
  // Change the water color
  map.setPaintProperty('water', 'fill-color', '#41b6c4'); // Customize this color to your preference

  // Change the land color
  map.setPaintProperty('land', 'background-color', '#e6e6e6'); // Customize this color to your preference
});


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

(function () {
  'use strict';

  var init = function () {
    var slider_century = new rSlider({
      target: '#slider_century',
      values: { min: 0, max: getCentury(currentTime.getFullYear()) },
      step: 1,
      range: false,
      set: [getCentury(currentTime.getFullYear())],
      scale: true,
      labels: false,
      onChange: function () {
        var min = (slider_century.getValue() - 1) * 100;
        var max = slider_century.getValue() * 100;

        // Generate an array of values from min to max
        var newValues = [];
        for (var i = min; i <= max; i++) {
          newValues.push(i);
        }

        // Update the scale with the generated values array
        slider.updateScale(newValues);
      }
    });

    var slider = new rSlider({
  target: '#slider',
  values: { min: 2000, max: currentTime.getFullYear() },
  step: 1,
  range: true,
  set: [2000, 2024],
  onChange: function (vals) {

    const [startYear, endYear] = vals.split(',').map(Number);

    updateMap(startYear,endYear);

      }
    });
  };

  window.onload = init;
})();


function getCentury(year) {
  const century = Math.ceil(year / 100);
  console.log(`Year: ${year}, Century: ${century}`);
  return century;
}


// Array to store markers and their associated year
let markers = [];

function updateMap(startYear, endYear) {
  // Remove markers that are not in the selected range
  markers = markers.filter(markerObj => {
    if (markerObj.year < startYear || markerObj.year > endYear) {
      markerObj.marker.remove(); // Remove the marker from the map
      return false; // Remove the marker from the array
    }
    return true; // Keep the marker in the array
  });

  // Create an array of fetch requests for the selected years
  const fetchPromises = [];

  for (let year = startYear; year <= endYear; year++) {
    fetchPromises.push(fetch(`/events/${year}`).then(response => response.json()));
  }

  // Wait for all fetch requests to complete
  Promise.all(fetchPromises)
    .then(allEvents => {
      allEvents.forEach(events => {
        // For each year's events, add markers to the map
        events.forEach(event => {
          // Create a popup for the event
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <img src="${event.image}" alt="${event.title}" style="width: 100%;">
          `);

          // Create a marker for the event
          const marker = new mapboxgl.Marker()
            .setLngLat(event.coordinates)
            .setPopup(popup)
            .addTo(map);

          // Store the marker and its associated year in the markers array
          markers.push({ marker, year: event.year });
        });
      });
    })
    .catch(error => {
      console.error('Error fetching events:', error);
      alert('Failed to load event data. Please try again later.');
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
const [startYear, endYear] = slider.getValue().split(',').map(Number);
updateMap(startYear,endYear);