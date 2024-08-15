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
const centuryDropdown = document.getElementById('century-dropdown');
const yearMarkersContainer = document.querySelector('.year-markers');
const customCenturyInput = document.getElementById('custom-century-input');
const centurySuffix = document.getElementById('century-suffix');


// Add event listeners for both slider and input field
yearSlider.addEventListener('input', () => {
  yearInput.value = yearSlider.value; // Update input field value when slider changes
  updateMap();
});

yearInput.addEventListener('input', () => {
  yearSlider.value = yearInput.value; // Update slider value when input field changes
  updateMap();
});

window.addEventListener('resize', () => {
    updateYearMarkers(parseInt(yearSlider.min), parseInt(yearSlider.max));
});

// Event listener for century dropdown
centuryDropdown.addEventListener('change', updateCenturySelection);

function updateCenturySelection() {
  if (centuryDropdown.value === 'custom') {
    customCenturyInput.style.display = 'inline';
    centurySuffix.style.display = 'inline';
  } else {
    const selectedCentury = parseInt(centuryDropdown.value);

    // Calculate the starting and ending years of the selected century
    const startYear = (selectedCentury - 1) * 100;
    const endYear = selectedCentury * 100;

    // Update the slider and input min/max values
    yearSlider.min = startYear;
    yearSlider.max = endYear;
    yearSlider.value = endYear; // Set to the last year of the selected century
    yearInput.min = startYear;
    yearInput.max = endYear;
    yearInput.value = endYear;

    // Update the year markers
    updateYearMarkers(startYear, endYear);

    // Hide the custom input and suffix
    customCenturyInput.style.display = 'none';
    centurySuffix.style.display = 'none';

    // Update the map to reflect the new year range
    updateMap();
  }
}

customCenturyInput.addEventListener('input', () => {
  const customCenturyValue = parseInt(customCenturyInput.value);

  if (!isNaN(customCenturyValue)) {
    const startYear = (customCenturyValue - 1) * 100;
    const endYear = customCenturyValue * 100;

    // Update the slider and input min/max values
    yearSlider.min = startYear;
    yearSlider.max = endYear;
    yearSlider.value = endYear; // Set to the last year of the custom century
    yearInput.min = startYear;
    yearInput.max = endYear;
    yearInput.value = endYear;

    // Update the year markers
    updateYearMarkers(startYear, endYear);

    // Update the suffix text
    centurySuffix.textContent = getOrdinalSuffix(customCenturyValue) + ' Century';

    // Update the map to reflect the new year range
    updateMap();
  }
});

function getOrdinalSuffix(number) {
  const j = number % 10,
        k = number % 100;
  if (j == 1 && k != 11) {
    return number + "st";
  }
  if (j == 2 && k != 12) {
    return number + "nd";
  }
  if (j == 3 && k != 13) {
    return number + "rd";
  }
  return number + "th";
}

function updateYearMarkers(startYear, endYear) {
  // Clear existing markers
  yearMarkersContainer.innerHTML = '';

  // Calculate the interval for the markers (e.g., every 10 years)
  const interval = 25;
  const sliderWidth = yearSlider.offsetWidth;

    for (let year = startYear; year <= endYear; year += interval) {
        const marker = document.createElement('span');
        marker.textContent = year;

        // Calculate the position of the marker
        const positionPercent = ((year - startYear) / (endYear - startYear)) * 100;
        marker.style.position = 'absolute';
        marker.style.left = `calc(${positionPercent}%)`; // Adjust -15px based on marker width

        yearMarkersContainer.appendChild(marker);
    }
}

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
