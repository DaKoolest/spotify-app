const albumCover = document.querySelector('[data-album-cover');
const albumNameElement = document.querySelector('[data-album-name]');
const artistNameElement = document.querySelector('[data-artist-name]');
const extraInfoElement = document.querySelector('[data-extra-album-info]');
const spotifyIconContainer = document.querySelector("[data-spotify-icon-container]");
const trackListContainer = document.querySelector("[data-track-list-container");
const dateInput = document.querySelector('[data-review-date]');
const submitElement = document.querySelector('[data-save-album');
const reviewTextArea = document.querySelector('[data-reivew-text]');

const trackTemplate = document.querySelector("[data-track-template]")

// handles date setting todays date as max and default in date field for logging album
const currentDate = new Date();
const year = currentDate.getFullYear();
let month = currentDate.getMonth() + 1; // Adding 1 because months are zero-based

if (month < 10) {
    month = `0${month}`;
}

let day = currentDate.getDate();
if (day < 10) {
    day = `0${day}`;
}

// sets date
const formattedDate = `${year}-${month}-${day}`;
dateInput.setAttribute('max', formattedDate);
dateInput.value = formattedDate;

// fetches the users input of the current album (album id a paramter in the the URL)
fetch("/getUserAlbum", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ albumId: new URLSearchParams(window.location.search).get('albumid') }),
})
    .then(response => response.json())
    .then(albumInfo => {
        // if the signed in user has an entry with the corrspedoning album id
        if (!("message" in albumInfo)) {
            // loads saved data from user entry for album into the fields
            dateInput.value = albumInfo.date;

            const radioInput = document.querySelector(`input[type="radio"][name="stars"][value="${albumInfo.rating}"]`);
            if (radioInput)
                radioInput.checked = true;

            reviewTextArea.value = albumInfo.review;
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });

// gets signed in user's profile picture and display name to display on the page
fetch("/getUserInfo")
    .then((response) => response.json())
    .then((data) => {
        document.querySelector("[data-user-display-name]").textContent = data.display_name;
        document.querySelector("[data-user-profile-picture]").src = data.images[0].url;
        document.querySelector("[data-user-profile-picture-container]").href = data.external_urls.spotify;

    });

// gets the album information from spotify api
fetch('/getAlbum', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            albumId: new URLSearchParams(window.location.search).get('albumid')
        })
        
    })
    .then(response => response.json())
    .then(album => {
        
        // fills out fields about album
        albumCover.src = album.images[0].url;
        albumCover.alt = album.name;
        albumNameElement.textContent = album.name;
        artistNameElement.textContent = `By ${album.artists[0].name}`;
        extraInfoElement.textContent = `${album.type.charAt(0).toUpperCase() + album.type.slice(1)}  Released ${album.release_date}`
        spotifyIconContainer.href = album.external_urls.spotify;

        // populates tracklist with all the songs
        album.tracks.items.forEach((track) => {
            const trackDiv = trackTemplate.content.cloneNode(true).children[0];

            // used to convert miliseconds to traditionally formatted mm:ss
            let trackSeconds = Math.trunc(track.duration_ms/1000)-Math.trunc(track.duration_ms/60000)*60;
            if (trackSeconds < 10) {
                trackSeconds = '0' + trackSeconds;
            }
    
            const trackLength = `${Math.trunc(track.duration_ms/60000)}:${trackSeconds}`;

            // sets extra track information
            trackDiv.querySelector('[data-track-number]').innerHTML = track.track_number;
            trackDiv.querySelector('[data-track-name]').innerHTML = track.name;
            trackDiv.querySelector('[data-track-length]').innerHTML = trackLength;

            trackListContainer.append(trackDiv);
        })

        // adds click even to submit button to save entry to database
        submitElement.addEventListener("click", (e) => {
            let rating = 0;
            const selectedRadio = document.querySelector('input[name="stars"]:checked');

            if (selectedRadio)
                rating = selectedRadio.value;

            // saves entry to database
            fetch('/addUserAlbum', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    albumId: new URLSearchParams(window.location.search).get('albumid'),
                    date: dateInput.value,
                    rating: rating,
                    review: reviewTextArea.value
                })
            })
            .then(response => response.json())
            .then(data => {
                // redirects user to library if entry successfully edited/created
                window.location.href = '/library';
            })
            .catch(error => {
                console.error('Error:', error);
            })


        })
    })
    .catch(error => {
        console.error('Album could not be loaded')
    });
