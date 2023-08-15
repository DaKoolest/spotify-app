// Album card template to display album information
const albumCardTemplate = document.querySelector("[data-album-template]")
// Container that holds albums that are being search for to be added by the user
const albumSearchCardContainer = document.querySelector("[data-album-search-cards]")


// gets signed in user's profile picture and display name to display on the page
fetch("/getUserInfo")
    .then((response) => response.json())
    .then((data) => {
        document.querySelector("[data-user-display-name]").textContent = data.display_name;
        document.querySelector("[data-user-profile-picture]").src = data.images[0].url;
        document.querySelector("[data-user-profile-picture-container]").href = data.external_urls.spotify;

    });

// offset for displaying albums
let offset = 0;
let loading = false;

// options for IntersectionObserver
const options = {
    root: null, // Use the viewport as the root
    rootMargin: '0px',
    threshold: 0 // Trigger when 10% of the target is visible
};

// infinite scrolling, if user gets to bottom of the page gets more entries to display
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        console.log('Can fetch and render')

        if (!loading && entry.isIntersecting) {
            loading = true;

            fetchAndRenderAlbums(10).then(() => {
                loading = false; // Reset loading to false when fetch is completed
            }).catch((error) => {
                console.error("Error fetching albums:", error);
                loading = false; // Reset loading in case of error
            });
        }
    });
}, options);
observer.observe(document.querySelector('.load-more'));

// gets search limit amount of albums from database
function fetchAndRenderAlbums(searchLimit) {
    return fetch("/getUserAlbums", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            offset: offset,
            limit: searchLimit
        }),
    })
        .then(response => response.json())
        .then(albums => {
            if (!("message" in albums) && albums.length > 0) {

                console.log(albums)

                // iterates through each album, getting info through spotify api
                // to add to the display for each user album
                albums.forEach(album => {
                    fetch('/getAlbum', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            albumId: album.album_id
                        })
                        
                    })
                        .then(response => response.json())
                        .then(album => {
                            const card = albumCardTemplate.content.cloneNode(true).children[0];

                            card.addEventListener("click", (e) => {
        
                                if (!e.target.closest(".spotify-icon-container") && !e.target.closest(".delete-button")) {
                                    window.location.href = `/album-view?albumid=${album.id}`;``
                                }
                            });
        
                            // gets html elements of the card to edit
                            const card_album_info = card.querySelector("[data-album-name]");
                            const card_artist_info = card.querySelector("[data-artist-name]");
                            const album_cover = card.querySelector("[data-album-cover]");
                            const spotify_icon_container = card.querySelector("[data-spotify-icon-container]");
                            const deleteButton = card.querySelector("[data-delete-button]");
        
                            // sets cards info to match the album info
                            album_cover.src = album.images[0].url;
                            album_cover.alt = album.name;
                            card_album_info.textContent = album.name;
                            card_artist_info.textContent = `By ${album.artists[0].name}`;
                            spotify_icon_container.href = album.external_urls.spotify;

                            // deletes entry and removes it from screen if button clicked on
                            deleteButton.addEventListener("click", (e) => {
                                fetch('/deleteUserAlbum', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        albumId: album.id
                                    })
                                })
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.message = 'Album entry deleted successfully') {
                                            card.remove();
                                            fetchAndRenderAlbums(1);
                                            offset--;
                                        }
                                    })
                            })

                            // adds the card to the container to display
                            albumSearchCardContainer.append(card);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        })
                })
            }

            offset += searchLimit;
        })
        .catch(error => {
            console.error("Error:", error);
        });
}