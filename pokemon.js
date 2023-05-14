// Declare and initialize variables
var pokemon = [];
const numPerPage = 10;
var numPages = 0;
const numPageBtn = 5;

// Setup function to fetch pokemon and types data
const setup = async () => {
    // Fetch initial list of Pokemon
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');

    // Fetch each Pokemon's details and store types
    const detailedPokemonPromises = response.data.results.map(async (poke) => {
        const detailedResponse = await axios.get(poke.url);
        return {
            name: poke.name,
            url: poke.url,
            types: detailedResponse.data.types.map(type => type.type.name)
        };
    });

    // Await all the detailed Pokemon Promises and calculate number of pages
    pokemon = await Promise.all(detailedPokemonPromises);
    numPages = Math.ceil(pokemon.length / numPerPage);

    // Fetch Pokemon types data
    let typesResponse = await axios.get('https://pokeapi.co/api/v2/type');
    let types = typesResponse.data.results;

    // Generate checkboxes for each Pokemon type
    for (let i = 0; i < types.length; i++) {
        $('#typeFilter').append(`
        <input id="${types[i].name}" class="typeFilter" type="checkbox" name="type" value="${types[i].name}">
        <label for="${types[i].name}">${types[i].name}</label>
        `);
    }

    // Display first page
    showPage(1);

    // Event listeners
    setupEventListeners();
};

// Event listeners setup function
const setupEventListeners = () => {
    // Click event on Pokemon card to open modal with details
    $('body').on('click', '.pokeCard', handlePokeCardClick);

    // Change event on type filter checkboxes to filter Pokemon
    $('body').on('change', '.typeFilter', handleTypeFilterChange);
    
    // Click event on pagination buttons to navigate pages
    $('body').on('click', '.pageBtn', handlePageBtnClick);
}

// Fetch and display Pokemon details in a modal
async function handlePokeCardClick(e) {
    const pokemonName = $(this).attr('pokeName');
    const res  = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const types = res.data.types.map((type) => type.type.name);

    const formattedName = res.data.name.replace(/\b\w/g, (match) => match.toUpperCase());

    $('.modal-body').html(`
            <div>
                <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${pokemonName}">
                <div>
                <h3>abilities</h3>
                <ul> ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}</ul>
                </div>
                <div>
                <h3>Stats</h3>
                <ul> ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}</ul>
                </div>
            </div>
            <h3>Types</h3>
            <ul> ${types.map((type) => `<li>${type}</li>`).join('')}</ul>
        `);
    $('.modal-title').html(`<h2>${formattedName}</h2>`)
}

// Filter Pokemon by selected types
async function handleTypeFilterChange() {
    // Get the checked types
    let checkedTypes = $('.typeFilter:checked').map(function () {
        return $(this).val();
    }).get();

    // Filter the Pokemon list based on checked types
    filterPokemonByType(checkedTypes);
}

// Navigate to the clicked page
async function handlePageBtnClick(e) {
    const pageNum = parseInt($(this).attr('pageNum'));
    showPage(pageNum);
}

// Filter Pokemon by types
async function filterPokemonByType(types) {
    // If more than 2 types are selected, clear the pokemon list and display a message
    if (types.length > 2) {
        pokemon = [];
        numPages = 0;
        $('#pokemon').html('<h2>Pokemon can have no more than two types.</h2>');
        $('#pokemonCount').html('<h1>Showing 0 of 0 Pokémon</h1>');
        return;
    }

    // If no types are selected, re-fetch and show all Pokemon
    if (types.length === 0) {
        let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
        const detailedPokemonPromises = response.data.results.map(async (poke) => {
            const detailedResponse = await axios.get(poke.url);
            return {
                name: poke.name,
                url: poke.url,
                types: detailedResponse.data.types.map(type => type.type.name)
            };
        });
        pokemon = await Promise.all(detailedPokemonPromises);
        numPages = Math.ceil(pokemon.length / numPerPage);
    } else {
        // If one or two types are selected, filter the pokemon list
        let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
        const detailedPokemonPromises = response.data.results.map(async (poke) => {
            const detailedResponse = await axios.get(poke.url);
            return {
                name: poke.name,
                url: poke.url,
                types: detailedResponse.data.types.map(type => type.type.name)
            };
        });
        const allPokemon = await Promise.all(detailedPokemonPromises);
        let filteredPokemon = allPokemon.filter(poke => 
            types.every(type => poke.types.includes(type))
        );

        // If no matching types are found, clear the pokemon list and display a message
        if (filteredPokemon.length === 0) {
            pokemon = [];
            numPages = 0;
            $('#pokemon').html('<h2>No Pokemon found matching the selected types.</h2>');
            $('#pokemonCount').html('<h1>Showing 0 of 0 Pokémon</h1>');
            return;
        }

        // Update pokemon and numPages
        pokemon = filteredPokemon;
        numPages = Math.ceil(pokemon.length / numPerPage);
    }

    showPage(1);
}

// Show a specific page of Pokemon
async function showPage(currentPage) {
    if (currentPage < 1) {
        currentPage = 1;
    }
    if (currentPage > numPages) {
        currentPage = numPages;
    }

    // Empty the pokemon container
    $('#pokemon').empty();

    // Display each Pokemon on this page
    for (let i = ((currentPage - 1) * numPerPage); i < (((currentPage-1) * numPerPage) + numPerPage) && (i < pokemon.length); i++) {
        let innerResponse = await axios.get(pokemon[i].url);
        let thisPokemon = innerResponse.data;
        const formattedName = thisPokemon.name.replace(/\b\w/g, (match) => match.toUpperCase());
        
        $('#pokemon').append(`
        <div class="pokeCard card" pokeName=${thisPokemon.name}>
        <h3>${formattedName}</h3>
        <img src="${thisPokemon.sprites.front_default}" alt="${thisPokemon.name}">
        <button type="button" class="btn btn-dark" data-bs-toggle="modal" data-bs-target="#pokeModal">More</button>
        </div>`
        );
    };

    // Update and display pagination buttons
    updatePaginationButtons(currentPage);

    // Display the "Showing [number] of [total]" message
    const showingCount = Math.min(numPerPage, pokemon.length - ((currentPage - 1) * numPerPage));
    const totalCount = pokemon.length;
    $('#pokemonCount').html(`<h1>Showing ${showingCount} of ${totalCount} Pokémon</h1>`);
}

// Update the pagination buttons
function updatePaginationButtons(currentPage) {
    $('#pagination').empty();
    const startI = Math.max(1, currentPage - Math.floor(numPageBtn / 2));
    const endI = Math.min(numPages, currentPage + Math.floor(numPageBtn / 2));

    if (currentPage > 1) {
        $('#pagination').append(`<button type="button" class="btn btn-outline-dark pageBtn" pageNum=${1}>First</button>`);
        $('#pagination').append(`<button type="button" class="btn btn-outline-dark pageBtn" pageNum=${currentPage - 1}>Previous</button>`);
    }

    for (let i = startI; i <= endI; i++) {
        const active = i === currentPage ? 'active' : '';
        $('#pagination').append(`<button type="button" class="btn btn-outline-dark pageBtn ${active}" pageNum=${i}>${i}</button>`);
    }

    if (currentPage < numPages) {
        $('#pagination').append(`<button type="button" class="btn btn-outline-dark pageBtn" pageNum=${currentPage + 1}>Next</button>`);
        $('#pagination').append(`<button type="button" class="btn btn-outline-dark pageBtn" pageNum=${numPages}>Last</button>`);
    }

    const showingCount = Math.min(numPerPage, pokemon.length - (currentPage - 1) * numPerPage);
    $('#pokemonCount').html(`<h1>Showing ${showingCount} of ${pokemon.length} Pokémon</h1>`);
}

// Call setup function when document is ready
$(document).ready(setup);
