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


const coordinates_btn = document.getElementById('set-coordinates-btn');
let addingEvent = false;

// Handle the button click to hide the form
if (coordinates_btn) {
    coordinates_btn.addEventListener('click', function() {
        var form = document.getElementById('event-form-container');
        if (form) {
            form.style.display = 'none';  // Hide the form when the button is clicked
            addingEvent = true; // Set the flag to true to start adding events
            map.getCanvas().classList.add('add-event-cursor'); // Change cursor to indicate adding mode
        }
    });
}



const coordinates_location = document.getElementById('set-coordinates-location');
let addingNewUser = false;

// Handle the button click to hide the form
if (coordinates_location) {
    coordinates_location.addEventListener('click', function() {
        var form = document.getElementById('login-form-container');
        if (form) {
            form.style.display = 'none';  // Hide the form when the button is clicked
            addingNewUser = true; // Set the flag to true to start adding events
            map.getCanvas().classList.add('add-event-cursor'); // Change cursor to indicate adding mode
        }
    });
}
// Handle map clicks
map.on('click', function(e) {
  if (addingEvent || addingNewUser) {
    const coordinates = e.lngLat;  // Get the coordinates from the click event
    document.getElementById('coordinates').value = `${coordinates.lng}and${coordinates.lat}`; // Set coordinates in the form
    const eventForm = document.getElementById('event-form-container');
    const userForm = document.getElementById('login-form-container');
    if (eventForm) {
        eventForm.style.display = 'flex';  // Show the form after the click
    }  else{
        userForm.style.display = 'flex';

    }

    map.getCanvas().classList.remove('add-event-cursor'); // Reset cursor
    addingEvent = false;  // Reset the flag
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

