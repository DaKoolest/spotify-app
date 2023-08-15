// Album card template to display album information
const albumCardTemplate = document.querySelector("[data-album-template]")
// Container that holds albums that are being search for to be added by the user
const albumSearchCardContainer = document.querySelector("[data-album-search-cards]")
// Input/searchbr for finding spotify albums
const spotifySearchInput = document.querySelector("[data-spotify-album-search]")

// gets signed in user's profile picture and display name to display on the page
fetch("/getUserInfo")
    .then((response) => response.json())
    .then((data) => {
        document.querySelector("[data-user-display-name]").textContent = data.display_name;
        document.querySelector("[data-user-profile-picture]").src = data.images[0].url;
        document.querySelector("[data-user-profile-picture-container]").href = data.external_urls.spotify;

    });


/* Adds an event listener to the spotify album search bar, calling the spotify api to
 * search its library of songs, displaying them in albumSearchContainer. Displays the
 * albums and their info as cards, which can be clicked on to be added to the users
 * listened to songs.
 */
let searchTimer;

spotifySearchInput.addEventListener("input", (e) => {
    // Clear the previous timeout to reset the timer
    clearTimeout(searchTimer);

    // Set a new timeout for 200 milliseconds (1/5 of a second)
    searchTimer = setTimeout(() => {
        // Data for post to backend, requesting to search albums with the provided query in the search bar
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: e.target.value,
                type: "album",
                limit: 12,
            }),
        };

        // Makes fetch request to backend to get album information and insert it into a card to display
        fetch("/searchAlbums", options)
            .then((response) => response.json())
            .then((data) => {
                // clears search container from previous cards when search input changes
                albumSearchCardContainer.innerHTML = "";

                // for each album returned
                data.forEach((album) => {
                    // copies the blank card template
                    const card = albumCardTemplate.content.cloneNode(true).children[0];

                    // adds on click even that opens the album view where user entries can be created
                    card.addEventListener("click", (e) => {

                        if (!e.target.closest(".spotify-icon-container")) {
                            window.location.href = `/album-view?albumid=${album.id}`;``
                        }
                    });

                    // gets html elements of the card to edit
                    const card_album_info = card.querySelector("[data-album-name]");
                    const card_artist_info = card.querySelector("[data-artist-name]");
                    const album_cover = card.querySelector("[data-album-cover]");
                    const spotify_icon_container = card.querySelector("[data-spotify-icon-container]");

                    // sets cards info to match the album info
                    album_cover.src = album.images[0].url;
                    album_cover.alt = album.name;
                    card_album_info.textContent = album.name;
                    card_artist_info.textContent = `By ${album.artists[0].name}`;
                    spotify_icon_container.href = album.external_urls.spotify;


                    // adds the card to the container to display
                    albumSearchCardContainer.append(card);
                });
            })
            .catch((error) => {
                console.error("Error searching with Spotify API:", error);
            });
    }, 400);
});