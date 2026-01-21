document.addEventListener('DOMContentLoaded', () => {
	// Get the containers
	const searchBoxContainer = document.getElementById('search-box');
	const resultsContainer = document.getElementById('results');
	const gameDetailsContainer = document.getElementById('game-details');

	// Create form inside search box
	const form = document.createElement('form');
	form.innerHTML = `
		<fieldset id="playerSearchFields">
			<legend>Search by Players:</legend>
			<label>
				<input type="radio" name="searchType" value="min" checked> Minimum players (1-5)
			</label>
			<label>
				<input type="radio" name="searchType" value="max"> Maximum players (1-10)
			</label>
			<input type="number" id="playerCount" min="1" placeholder="Number of players" required>
		</fieldset>
		<fieldset id="mechanicSearchFields">
			<legend>Search by Mechanic:</legend>
			<label>
				<input type="radio" name="searchType" value="mechanic"> Search by game mechanic
			</label>
			<select id="mechanicInput" disabled>
				<option value="">-- Select a mechanic --</option>
			</select>
		</fieldset>
		<button type="submit">Search</button>
	`;
	searchBoxContainer.appendChild(form);

	// Set initial GAME DETAILS content
	gameDetailsContainer.innerHTML = '<p class="no-selection">Click on a game name to see details.</p>';

	let games = [];

	// Get form elements
	const playerCountInput = document.getElementById('playerCount');
	const mechanicInput = document.getElementById('mechanicInput');
	const playerSearchFields = document.getElementById('playerSearchFields');
	const mechanicSearchFields = document.getElementById('mechanicSearchFields');
	const searchTypeRadios = form.elements['searchType'];

	// Handle search type change to enable/disable fields
	searchTypeRadios.forEach(radio => {
		radio.addEventListener('change', function() {
			if (this.value === 'mechanic') {
				// Disable player search fields
				playerCountInput.disabled = true;
				playerCountInput.removeAttribute('required');
				playerSearchFields.style.opacity = '0.5';
				mechanicSearchFields.style.opacity = '1';
				// Enable mechanic input
				mechanicInput.disabled = false;
				mechanicInput.setAttribute('required', 'required');
			} else {
				// Enable player search fields
				playerCountInput.disabled = false;
				playerCountInput.setAttribute('required', 'required');
				playerSearchFields.style.opacity = '1';
				mechanicSearchFields.style.opacity = '0.5';
				// Disable mechanic input
				mechanicInput.disabled = true;
				mechanicInput.removeAttribute('required');
			}
		});
	});

	// Load games from games.json
	fetch('games-resources/games.json')
		.then(response => response.json())
		.then(data => {
			games = data;
		})
		.catch(err => {
			console.error('Error loading games:', err);
			resultsContainer.textContent = 'Failed to load games data.';
		});

	// Load mechanics from mechanics.json and populate dropdown
	fetch('games-resources/mechanics.json')
		.then(response => response.json())
		.then(mechanics => {
			const mechanicSelect = document.getElementById('mechanicInput');
			mechanics.forEach(mechanic => {
				const option = document.createElement('option');
				option.value = mechanic;
				option.textContent = mechanic;
				mechanicSelect.appendChild(option);
			});
		})
		.catch(err => {
			console.error('Error loading mechanics:', err);
		});

	form.addEventListener('submit', function(e) {
		e.preventDefault();
		const searchType = form.elements['searchType'].value;
		
		if (searchType === 'mechanic') {
			const mechanicSearch = mechanicInput.value.trim();
			if (!mechanicSearch) {
				resultsContainer.textContent = 'Please select a mechanic to search for.';
				return;
			}
			const filtered = games.filter(game => {
				const gameMechanics = game.mechanics.split(',').map(m => m.trim());
				return gameMechanics.includes(mechanicSearch);
			});
			displayResults(filtered, mechanicSearch, 'mechanic');
		} else {
			const playerCount = parseInt(playerCountInput.value, 10);
			if (isNaN(playerCount)) {
				resultsContainer.textContent = 'Please enter a valid number.';
				return;
			}
			let filtered = [];
			if (searchType === 'min') {
				filtered = games.filter(game => Number(game.min_players) === playerCount);
			} else {
				filtered = games.filter(game => Number(game.max_players) === playerCount);
			}
			displayResults(filtered, playerCount, searchType);
		}
	});

	function displayResults(games, searchValue, searchType) {
		if (!games.length) {
			if (searchType === 'mechanic') {
				resultsContainer.innerHTML = `<p>No games found with mechanic: <strong>${searchValue}</strong></p>`;
			} else {
				resultsContainer.innerHTML = `<p>No games found for ${searchType === 'min' ? 'minimum' : 'maximum'} ${searchValue} players.</p>`;
			}
			return;
		}
		resultsContainer.innerHTML = `<ul>${games.map((game, idx) => `<li><span class="game-name" data-idx="${idx}">${game.game}</span> <br><small>(players: ${game.min_players === game.max_players ? game.min_players : `${game.min_players}-${game.max_players}`})</small></li>`).join('')}</ul>`;

		// Add click event listeners to each game name
		document.querySelectorAll('.game-name').forEach(el => {
			el.addEventListener('click', function(e) {
				e.preventDefault();
				const gameIndex = parseInt(el.getAttribute('data-idx'), 10);
				const game = games[gameIndex];
				displayGameDetails(game);
			});
		});
	}

	function displayGameDetails(game) {
		const gameName = game.bgg_url 
			? `<a href="${game.bgg_url}" target="_blank" rel="noopener noreferrer">${game.game}</a>`
			: `<a href="https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(game.game)}" target="_blank" rel="noopener noreferrer">${game.game}</a>`;
		
		gameDetailsContainer.innerHTML = `
			<h3>${gameName}</h3>
			<p><strong>Year:</strong> ${game.year ? game.year : 'N/A'} &nbsp; | &nbsp; <strong>Players:</strong> ${game.min_players}${game.min_players !== game.max_players ? '-' + game.max_players : ''} &nbsp; | &nbsp; <strong>Age:</strong> ${game.age}+ &nbsp; | &nbsp; <strong>Complexity:</strong> ${game.complexity}/5</p>
			<p><strong>Playing Time:</strong> ${game.playing_time || 'N/A'}</p>
			<p><strong>Mechanics:</strong> ${game.mechanics}</p>
			<p><strong>Description:</strong> ${linkifyUrls(game.description)}</p>
			${formatExpansion(game.expansion)}
		`;
	}

	// Helper function to convert URLs to clickable links
	function linkifyUrls(text) {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
	}

	// Helper to format expansion field (handles object with any number of elements)
	function formatExpansion(expansion) {
	if (!expansion || typeof expansion !== 'object') return '';
	
	// Filter out 'No' values and falsy entries
	const items = Object.values(expansion).filter(item => {
		if (item === 'No' || !item) return false;
		// Accept both new object format and old string format
		return typeof item === 'string' || (typeof item === 'object' && item.title);
	});
	
	if (items.length === 0) return '';
	
	// Format each expansion item
	const formattedItems = items.map(item => {
		if (typeof item === 'object' && item.title) {
		// New format: {title, description}
		return `<strong>${item.title}</strong>: ${linkifyUrls(item.description)}`;
		}
		// Fallback for old string format
		return linkifyUrls(item);
	});
	
	return `<p><strong>Expansions:</strong><br>${formattedItems.join('<br>')}</p>`;
	}
});

