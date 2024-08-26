mapboxgl.accessToken = 'pk.eyJ1IjoibW9raHRhcnNhbGVtcyIsImEiOiJjbHoybmhwYWwzMGZuMmlxc2tpaDhlNmkzIn0.3B1q00jaaxe2IsYm0icQlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
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
const filters_btn = document.getElementById('show-filters-btn');
const filters_btn_mobile = document.getElementById('show-filters-btn-m');

function toggleFilters() {
    var SliderContainer = document.getElementById('SliderContainer');
    var FilterContainer = document.getElementById('FilterContainer');
    if (SliderContainer && FilterContainer) {
        SliderContainer.style.display = 'none';
        FilterContainer.style.display = 'flex';
    }
}

if (filters_btn) {
    filters_btn.addEventListener('click', toggleFilters);
}

if (filters_btn_mobile) {
    filters_btn_mobile.addEventListener('click', toggleFilters);
}

const close_icon = document.getElementById('close-icon');

if (close_icon) {
    close_icon.addEventListener('click', function() {
        var SliderContainer = document.getElementById('SliderContainer');
        var FilterContainer = document.getElementById('FilterContainer');
        var Options = document.getElementById("myLinks");
        if (SliderContainer && FilterContainer) {
            if (Options.style.display != 'block') {
                SliderContainer.style.display = 'block';
                }
            FilterContainer.style.display = 'none';
        }
    });
}

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

        var newValues = [];
        for (var i = min; i <= max; i++) {
          newValues.push(i);
        }

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

let markers = [];

function updateMap(startYear, endYear) {
  markers = markers.filter(markerObj => {
    if (markerObj.year < startYear || markerObj.year > endYear) {
      markerObj.marker.remove();
      return false;
    }
    return true;
  });

  const fetchPromises = [];

  for (let year = startYear; year <= endYear; year++) {
    fetchPromises.push(fetch(`/events/${year}`).then(response => response.json()));
  }

  Promise.all(fetchPromises)
    .then(allEvents => {
      allEvents.forEach(events => {
        events.forEach(event => {
          const popupContent = `
            <h3>${event.title}</h3>
            <div class="popup-description">
                <p>${event.description}</p>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

          // Fetch the image data for the event
          if (event.image) {
            fetch(event.image)
              .then(response => response.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const imgHTML = `<img src="${reader.result}" alt="${event.title}" style="width: 100%;">`;
                  popup.setHTML(popupContent + imgHTML);
                };
                reader.readAsDataURL(blob);
              })
              .catch(error => console.error('Error fetching image:', error));
          }

          const coordinates = event.coordinates.map(Number);

          const marker = new mapboxgl.Marker()
            .setLngLat(coordinates)
            .setPopup(popup)
            .addTo(map);

          markers.push({ marker, year: event.year });
        });
      });
    })
    .catch(error => {
      console.error('Error fetching events:', error);
      alert('Failed to load event data. Please try again later.');
    });
}
function showNavs() {
  var x = document.getElementById("myLinks");
  var con = document.getElementById("SliderContainer");
  if (x.style.display === "block") {
    con.style.display = "block";
    x.style.display = "none";
  } else {
  con.style.display = "none";
    x.style.display = "block";
  }
}