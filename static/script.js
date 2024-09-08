mapboxgl.accessToken = 'pk.eyJ1IjoibW9raHRhcnNhbGVtcyIsImEiOiJjbHoybmhwYWwzMGZuMmlxc2tpaDhlNmkzIn0.3B1q00jaaxe2IsYm0icQlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0, 0],
  zoom: 3
});

var currentTime = new Date()
let filters = [];
let showSeen = true;


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


function closeFiltersWindow(){

var SliderContainer = document.getElementById('SliderContainer');
var FilterContainer = document.getElementById('FilterContainer');
var Options = document.getElementById("myLinks");
if (SliderContainer && FilterContainer) {
    if (Options.style.display != 'block') {
        SliderContainer.style.display = 'block';
        }
    FilterContainer.style.display = 'none';
}
     }



const close_icon = document.getElementById('close-icon');

if (close_icon) {
    close_icon.addEventListener('click', closeFiltersWindow);
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

function changeEra(){

        console.log('era clicked');
        newValues = [];
        for (var i = -5000; i <= 0; i++) {
          newValues.push(i);
        }
        slider_century.updateScale(newValues);



}
const eraChanger = document.getElementById('eraChanger');

if (eraChanger) {
    eraChanger.addEventListener('click', changeEra);
}

function getCentury(year) {
  const century = Math.ceil(year / 100);
  console.log(`Year: ${year}, Century: ${century}`);
  return century;
}

let markers = [];

function updateMap(startYear, endYear) {
    // Remove markers that are out of the specified year range or don't match the filters
    markers = markers.filter(markerObj => {
        if (markerObj.year < startYear || markerObj.year > endYear || !filters.includes(markerObj.category)) {
            console.log('removing ', markerObj.title);
            markerObj.marker.remove();
            return false;
        }
        return true;
    });

    // Prepare an array to hold the promises for fetching events data
    const fetchPromises = [];

    // Join the selected categories into a comma-separated string
    const selectedCategories = filters.join(',');

    for (let year = startYear; year <= endYear; year++) {
        // Fetch events for each year, including the selected categories as query parameters
        fetchPromises.push(fetch(`/events/${year}`).then(response => response.json()));
    }

    console.log("fetched");

    Promise.all(fetchPromises)
        .then(allEvents => {
            allEvents.forEach(events => {
                events.forEach(event => {
                    // Skip events that don't match the category filter
                    if (filters.length > 0 && !filters.includes(event.category)) {
                        console.log("Skipped");
                        return;
                    }

                    console.log("adding ", event.title);

                    // Create the popup content with the new buttons
                    const popupContent = `
                        <h4>${event.title}</h4>
                        <h6>${event.date}</h6>
                        <div class="popup-description">
                            <p>${event.description}</p>
                        </div>
                    `;

                    // create the buttons after the image
                    const buttonsHTML = `
                        <button type="button" class="btn btn-outline-danger">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                              <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"></path>
                            </svg>
                            1K
                        </button>

                        <button type="button" class="btn btn-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-left" viewBox="0 0 16 16">
                              <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"></path>
                            </svg>
                            Comment
                        </button>
                    `;

                    const popup = new mapboxgl.Popup({ offset: 50 }).setHTML(popupContent);



                    // Fetch the image data for the event, if available
                    if (event.image) {
                        fetch(event.image)
                            .then(response => response.blob())
                            .then(blob => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const imgHTML = `<img src="${reader.result}" alt="${event.title}" style="width: 100%;">`;

                                    // Update the popup content with the image and buttons
                                    popup.setHTML(popupContent + imgHTML + buttonsHTML);
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

                    markers.push({ marker, year: event.year, category: event.category, title: event.title });
                    console.log(event.category);
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




function applyFilters() {
    // Clear the current filters
    filters = [];
    filters.push('all-pins');
    // Get all the checkbox elements for the categories
    const checkboxes = document.querySelectorAll('.form-check-input[type="checkbox"]');

    // Loop through each checkbox to see if it's checked
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            filters.push(checkbox.value);  // Add the value of the checked checkbox to the filters array
        }
    });

    // Get the selected pin visibility option
    const visibility = document.querySelector('.form-check-input[name="pinVisibility"]:checked');
    if (visibility) {
        showSeen = visibility.value === 'all';  // Set showSeen to true if 'all' is selected, false otherwise
    }

    // Debugging: Log the filters and showSeen values to verify they are correct
    console.log("Selected Filters:", filters);
    console.log("Show All Pins:", showSeen);
    const sliderValues = document.querySelector('#slider').value.split(',').map(Number);
    const [startYear, endYear] = sliderValues;

    // Call updateMap with the selected years and categories
    updateMap(startYear, endYear);
    closeFiltersWindow();
    // Optionally, you could now call a function to update the display based on the new filters
    // For example, you might want to send an AJAX request to update the displayed pins
}

// Attach the applyFilters function to the button click event
const applyFilters_btn = document.getElementById('ApplyFilters');
if (applyFilters_btn) {
    applyFilters_btn.addEventListener('click', applyFilters);
}


