document.addEventListener('DOMContentLoaded', () => {
	// Get the containers
	const searchBoxContainer = document.getElementById('search-box');
	const resultsContainer = document.getElementById('results');
	const gameDetailsContainer = document.getElementById('game-details');

	// Create form inside search box
	const form = document.createElement('form');
	form.innerHTML = `
		<label>
			<input type="radio" name="searchType" value="min" checked> Minimum players
		</label>
		<label>
			<input type="radio" name="searchType" value="max"> Maximum players
		</label>
		<input type="number" id="playerCount" min="1" placeholder="Number of players" required>
		<button type="submit">Search</button>
	`;
	searchBoxContainer.appendChild(form);

	// Set initial GAME DETAILS content
	gameDetailsContainer.innerHTML = '<p class="no-selection">Select a game to see details.</p>';

	let games = [];

	// Load games from data.json
	fetch('games-resources/data.json')
		.then(response => response.json())
		.then(data => {
			games = data;
		})
		.catch(err => {
			console.error('Error loading games:', err);
			resultsContainer.textContent = 'Failed to load games data.';
		});

	form.addEventListener('submit', function(e) {
		e.preventDefault();
		const searchType = form.elements['searchType'].value;
		const playerCount = parseInt(document.getElementById('playerCount').value, 10);
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
	});

	function displayResults(games, playerCount, searchType) {
		if (!games.length) {
			resultsContainer.innerHTML = `<p>No games found for ${searchType === 'min' ? 'minimum' : 'maximum'} ${playerCount} players.</p>`;
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
		gameDetailsContainer.innerHTML = `
			<h3>${game.game}</h3>
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

