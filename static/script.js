mapboxgl.accessToken = 'pk.eyJ1IjoibW9raHRhcnNhbGVtcyIsImEiOiJjbHoybmhwYWwzMGZuMmlxc2tpaDhlNmkzIn0.3B1q00jaaxe2IsYm0icQlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0, 0],
  zoom: 3
});


var currentPinId;


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

function genValues(min, max){

        var newValues = [];
        for (var i = min; i <= max; i++) {
          newValues.push(i);
        }
}
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
      labels: true,

      onChange: function () {

        var min = (slider_century.getValue() - 1) * 100;
        var max = slider_century.getValue() * 100;

        var newValues = [];
        for (var i = min; i <= max; i++) {
          newValues.push(i);
        }

        // Check if newValues is valid before updating scale
        if (newValues.length > 0) {
          slider.updateScale(newValues);
        } else {
          console.error('Error: Invalid newValues array.');
        }
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
        updateMap(startYear, endYear);
      }
    });

        function changeEra(min, max){


        var newValues = [];
        for (var i = min; i <= max; i++) {
          newValues.push(i);
        }
        slider_century.updateScale(newValues);

}
const eraChangerBC = document.getElementById('eraChangerBC');
const eraChangerAC = document.getElementById('eraChangerAC');

if (eraChangerBC) {
    eraChangerBC.addEventListener('click', function() {
        changeEra(-50, 0);
    });
}

if (eraChangerAC) {
    eraChangerAC.addEventListener('click', function() {
        changeEra(0, 21);
    });
}


  };

  window.onload = init;
})();




function getCentury(year) {
  const century = Math.ceil(year / 100);
  console.log(`Year: ${year}, Century: ${century}`);
  return century;
}

let markers = [];function setMarkerImage(markerElement, imageUrl) {
    markerElement.style.backgroundImage = `url(${imageUrl})`;
    markerElement.style.backgroundSize = 'contain';
    markerElement.style.backgroundRepeat = 'no-repeat';
    markerElement.style.width = '30px';  // Adjust width as needed
    markerElement.style.height = '40px'; // Adjust height as needed
}

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

    for (let year = startYear; year <= endYear; year++) {
        // Fetch events for each year
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

                    // Create the popup content
                    const popupContent = `
                        <h4>${event.title}</h4>
                        <p>${event.date}</p>

                        <div class="popup-description">
                            <p>${event.description}</p>
                        </div>

                    `

                    // create the buttons after the image
                    const buttonsHTML = `
                        <button type="button" class="${event.like_state}" id ="like-btn" onclick="likePin(${event.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
                                <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"></path>
                            </svg>
                            <span id="like-count">${event.no_of_likes}</span>
                        </button>


                        <button type="button" class="btn btn-success" id ="comment-btn" onclick="commentPin(${event.id})">
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


                    // Create a custom marker element (e.g., a div for the image-based pin)
                    const markerElement = document.createElement('div');
                    markerElement.className = 'custom-marker';

                    // Set the marker image (use your pin.png image here)
                   switch(event.category) {
                        case 'Places-to-Visit':
                            setMarkerImage(markerElement, '/static/yelloy-pin.png');
                            break;
                        case 'Local-Products':
                            setMarkerImage(markerElement, '/static/black-pin.png');
                            break;
                        case 'History':
                            setMarkerImage(markerElement, '/static/red-pin.png');
                            break;
                        case 'Biographies':
                            setMarkerImage(markerElement, '/static/blue-pin.png');
                            break;
                        default:
                            setMarkerImage(markerElement, '/static/red-pin.png');
                            break;
                    }


                    // Add the marker with the image to the map
                    const marker = new mapboxgl.Marker(markerElement)
                        .setLngLat(event.coordinates.map(Number))
                        .setPopup(popup) // Attach the popup to the marker
                        .addTo(map);

                    // Add the marker to the markers array
                    markers.push({ marker, year: event.year, category: event.category, title: event.title });
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

// Function to check for the button and add the event listener
function addScrollToTop() {
    const closeButton = document.querySelector('.mapboxgl-popup-close-button');

    if (closeButton) {

        closeButton.addEventListener('click', function() {

        window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

         document.documentElement.scrollTop = 0; // For most browsers
    document.body.scrollTop = 0; // For Safari
        });
        return true; // Return true when the button is found and event listener is added
    } else {

        return false; // Button not found, retry
    }
}

// Set an interval to keep checking for the button every 500 milliseconds
const checkInterval = setInterval(function() {
    if (addScrollToTop()) {

    }
}, 500);
function likePin(pinId) {
    console.log(pinId, "Liked");

    // Send the like request to the server using Fetch API
    fetch(`/like/${pinId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrf_token')  // Assuming you are using CSRF tokens
        },
        credentials: 'same-origin'  // Include cookies with request
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the like count on the frontend
            const likeCountElement = document.getElementById('like-count');
            likeCountElement.innerText = data.new_like_count;

            // Toggle the button color based on the 'liked' status
            const likeButton = document.getElementById('like-btn');

            if (data.liked) {
                // Remove the outline class if it's liked, and add the filled red class
                likeButton.classList.remove('btn-outline-danger');
                likeButton.classList.add('btn-danger');
            } else {
                // Remove the filled red class if unliked, and add the outline class
                likeButton.classList.remove('btn-danger');
                likeButton.classList.add('btn-outline-danger');
            }
        } else {
            console.error('Error liking pin:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Optional: Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


function commentPin(pinId) {
    var commentModal = new bootstrap.Modal(document.getElementById('commentPopup'));
    commentModal.show();

    // Make an AJAX request to get the comments for the pin
    $.ajax({
        url: `/get_comments/${pinId}`,
        type: 'GET',
        success: function (comments) {
            var commentSection = document.getElementById('commentSection');
            commentSection.innerHTML = ''; // Clear existing comments

            comments.forEach(function (comment) {
                var commentHTML = `
                    <div class="card mb-4">
                      <div class="card-body">
                        <p>${comment.text}</p>
                        <div class="justify-content-between">
                          <div class="d-flex flex-row align-items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
                              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"></path>
                            </svg>
                            <p class="small mb-0 ms-2">${comment.user}</p>
                          </div>
                        </div>
                      </div>
                    </div>`;

                // Append the comment HTML to the comment section
                commentSection.innerHTML += commentHTML;
            });
        },
        error: function () {
            console.error('Failed to fetch comments');
        }
    });
}


document.getElementById('submitComment').addEventListener('click', function() {
        var pinId = 1;
        var commentText = document.getElementById('addANote').value;

        // Send the comment to the server via AJAX
        $.ajax({
            url: '/submit_comment',
            type: 'POST',
            data: JSON.stringify({ pin_id: pinId, text: commentText }),
            contentType: 'application/json',
            success: function(response) {
                // Optionally, update the comments section after successfully posting
                console.log('Comment submitted successfully!');
                document.getElementById('addANote').value = ''; // Clear the input field
                // Optionally refresh comments
                commentPin(pinId);
            },
            error: function(error) {
                console.error('Error submitting comment', error);
            }
        });
    });