mapboxgl.accessToken = 'pk.eyJ1IjoibW9raHRhcnNhbGVtcyIsImEiOiJjbHoybmhwYWwzMGZuMmlxc2tpaDhlNmkzIn0.3B1q00jaaxe2IsYm0icQlw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [0, 0],
  zoom: 3
});


var currentPinId;
var currentTime = new Date();
let filters = [];
let seenPins = [];
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

        if( !showSeen && !seenPins.includes(markerObj.id)){


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

                    if( !showSeen && !seenPins.includes(event.id)) {
                        console.log("Skipped");
                        return;
                    }

                    console.log("adding ", event.title);

                    // Create the popup content
                    const popupContent = `
                    <div data-event-id="${event.id}">
                        <h4>${event.title}</h4>
                        <div style="display: inline-block;">

                            <p style="display: inline;">${ event.author }</p>
                            <p style="display: inline; margin-right: 10px;">${ event.date }</p>

                        </div>

                        <div class="popup-description">
                            <p>${event.description}</p>
                        </div>

                    `



                    // Assuming event.is_author is a boolean indicating if the current user is the author of the pin
let buttonsHTML = `
    <button type="button" class="${event.like_state}" id="like-btn" onclick="likePin(${event.id})">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart" viewBox="0 0 16 16">
            <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"></path>
        </svg>
        <span id="like-count">${event.no_of_likes}</span>
    </button>

    <button type="button" class="btn btn-success" id="comment-btn" onclick="commentPin(${event.id})">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-left" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"></path>
        </svg>
        Comment
    </button>
`;

// Only add the delete button if the current user is the author of the pin
if (event.is_author) {
    buttonsHTML += `
        <form action="/delete_pin/${event.id}" method="post" style="display:inline;">
            <!-- CSRF token if using Flask-WTF -->
            <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
            <button type="submit" class="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"></path>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"></path>
                </svg>

            </button>
        </form>
    `;
}





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
                    } else{


                    popup.setHTML(popupContent + buttonsHTML);


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
                    markers.push({ marker, year: event.year, category: event.category, title: event.title, id: event.id });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            console.log(event);
            console.errr('Failed to load event data. Please try again later.');
        });
}

function showNavs() {
  var links = document.getElementById("myLinks");
  var con = document.getElementById("SliderContainer");
  var eventCon = document.getElementById("event-form-container");

  if (links && con){
    if (links.style.display === "block") {

        con.style.display = "block";
        links.style.display = "none";
    } else {
        con.style.display = "none";
        links.style.display = "block";
    }
  } else if (links && eventCon){

      if (links.style.display === "block") {

        eventCon.style.display = "flex";
        links.style.display = "none";
    } else {
        eventCon.style.display = "none";
        links.style.display = "block";
    }



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

    if (!showSeen) {
    // Fetch unseen pins only if the user wants to see unseen pins
    fetch('/unseen_pins')
        .then(response => response.json())
        .then(data => {
            seenPins = data.unseen_pin_ids;
            console.log('Unseen pin IDs:', seenPins);
            // You can now use the seenPins array to handle visibility in your application
        })
        .catch(error => console.error('Error fetching unseen pins:', error));
        }

    // Debugging: Log the filters and showSeen values to verify they are correct
    console.log("Selected Filters:", filters);
    console.log("Show All Pins:", showSeen);
    const sliderValues = document.querySelector('#slider').value.split(',').map(Number);
    const [startYear, endYear] = sliderValues;

    // Call updateMap with the selected years and categories
    updateMap(startYear, endYear);
    closeFiltersWindow();
}

// Attach the applyFilters function to the button click event
const applyFilters_btn = document.getElementById('ApplyFilters');
if (applyFilters_btn) {
    applyFilters_btn.addEventListener('click', applyFilters);
}

function markPinAsSeen(eventId) {
    // Send the event ID to the server to mark it as seen
    fetch('/mark_as_seen', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'event_id': eventId })
    })
    .then(response => {
        // Check if the response is JSON
        if (response.headers.get('content-type')?.includes('application/json')) {
            return response.json();
        } else {
            throw new Error('Not authenticated or server error');
        }
    })
    .then(data => {
        if (data.success) {
            console.log('Event marked as seen:', eventId);
            seenPins.push(eventId);
        } else {
            console.log('Failed to mark event as seen:', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Redirect to login page or show a login prompt
        window.location.href = '/login';
    });
}


// Function to get CSRF token if using Flask-WTF for CSRF protection
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
 let btn_found =false;
// Function to check for the button and add the event listener
function addScrollToTop() {



    const closeButton = document.querySelector('.mapboxgl-popup-close-button');

    if (closeButton) {
        btn_found = true;
        const contentBox = document.querySelector('.mapboxgl-popup-content');
        if (contentBox) {
        const childElement = contentBox.querySelector('[data-event-id]');
        if (childElement) {
            const eventId = childElement.getAttribute('data-event-id');
            console.log('Event ID:', eventId);
            markPinAsSeen(eventId);
        } else {
            console.error('Child element with data-event-id not found');
        }
        } else {
            console.error('Element with class .mapboxgl-popup-content not found');
        }

        closeButton.addEventListener('click', function() {

        window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

         document.documentElement.scrollTop = 0; // For most browsers
    document.body.scrollTop = 0; // For Safari
    btn_found= false;
        });
        return true; // Return true when the button is found and event listener is added
    } else {

        return false; // Button not found, retry
    }
}

// Set an interval to keep checking for the button every 500 milliseconds
const checkInterval = setInterval(function() {
    if (!btn_found && addScrollToTop() ) {}
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
    currentPinId = pinId;

    // Make an AJAX request to get the comments for the pin
    $.ajax({
        url: `/get_comments/${pinId}`,
        type: 'GET',
        success: function (comments) {
            console.log("Adding comments!!!!!!!!!!", pinId);
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


const submitCommentBtn = document.getElementById('submitComment');

if (submitCommentBtn){

    submitCommentBtn.addEventListener('click', function() {
            var pinId = currentPinId;
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


}
