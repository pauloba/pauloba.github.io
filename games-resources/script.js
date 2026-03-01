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
				<input type="radio" name="searchType" value="range" checked> Range of players (1-10)
				<span style="margin-left:8px;">
					<input type="number" id="playerMin" min="1" max="10" style="width:70px;" disabled>
					-
					<input type="number" id="playerMax" min="1" max="10" style="width:70px;" disabled>
				</span>
			</label>
			<label>
				<input type="radio" name="searchType" value="min"> Minimum players (1-5)
				<span style="margin-left:8px;">
					<input type="number" id="playerMinOnly" min="1" max="10" style="width:70px;" disabled>
				</span>
			</label>
			<label>
				<input type="radio" name="searchType" value="max"> Maximum players (1-5)
				<span style="margin-left:8px;">
					<input type="number" id="playerMaxOnly" min="1" max="10" style="width:70px;" disabled>
				</span>
			</label>
		</fieldset>
		<fieldset id="mechanicSearchFields">
			<legend>Search by Mechanic:</legend>
			<label>
				<input type="radio" name="searchType" value="mechanic"> Search by game mechanic
			</label>
			<select id="mechanicInput" disabled>
				<option value=""></option>
			</select>
		</fieldset>
		<button type="submit">Search</button>
	`;
	searchBoxContainer.appendChild(form);

	// Set initial GAME DETAILS content
	gameDetailsContainer.innerHTML = '<p class="no-selection">Click on a game name to see details.</p>';

	let games = [];

	// Get form elements
	const playerMinInput = document.getElementById('playerMin');
	const playerMaxInput = document.getElementById('playerMax');
	const playerMinOnlyInput = document.getElementById('playerMinOnly');
	const playerMaxOnlyInput = document.getElementById('playerMaxOnly');
	const mechanicInput = document.getElementById('mechanicInput');
	const playerSearchFields = document.getElementById('playerSearchFields');
	const mechanicSearchFields = document.getElementById('mechanicSearchFields');
	const searchTypeRadios = form.elements['searchType'];

	// Handle search type change to enable/disable fields
	function updateInputEnableState() {
		const selected = form.elements['searchType'].value;
		if (selected === 'mechanic') {
			playerMinOnlyInput.disabled = true;
			playerMaxOnlyInput.disabled = true;
			playerMinOnlyInput.removeAttribute('required');
			playerMaxOnlyInput.removeAttribute('required');
			playerMinInput.disabled = true;
			playerMaxInput.disabled = true;
			playerMinInput.removeAttribute('required');
			playerMaxInput.removeAttribute('required');
			playerSearchFields.style.opacity = '0.5';
			mechanicSearchFields.style.opacity = '1';
			mechanicInput.disabled = false;
			mechanicInput.setAttribute('required', 'required');
		} else if (selected === 'range') {
			playerMinOnlyInput.disabled = true;
			playerMaxOnlyInput.disabled = true;
			playerMinOnlyInput.removeAttribute('required');
			playerMaxOnlyInput.removeAttribute('required');
			playerMinInput.disabled = false;
			playerMaxInput.disabled = false;
			playerMinInput.setAttribute('required', 'required');
			playerMaxInput.setAttribute('required', 'required');
			playerSearchFields.style.opacity = '1';
			mechanicSearchFields.style.opacity = '0.5';
			mechanicInput.disabled = true;
			mechanicInput.removeAttribute('required');
		} else if (selected === 'min') {
			playerMinOnlyInput.disabled = false;
			playerMinOnlyInput.setAttribute('required', 'required');
			playerMaxOnlyInput.disabled = true;
			playerMaxOnlyInput.removeAttribute('required');
			playerMinInput.disabled = true;
			playerMaxInput.disabled = true;
			playerMinInput.removeAttribute('required');
			playerMaxInput.removeAttribute('required');
			playerSearchFields.style.opacity = '1';
			mechanicSearchFields.style.opacity = '0.5';
			mechanicInput.disabled = true;
			mechanicInput.removeAttribute('required');
		} else if (selected === 'max') {
			playerMaxOnlyInput.disabled = false;
			playerMaxOnlyInput.setAttribute('required', 'required');
			playerMinOnlyInput.disabled = true;
			playerMinOnlyInput.removeAttribute('required');
			playerMinInput.disabled = true;
			playerMaxInput.disabled = true;
			playerMinInput.removeAttribute('required');
			playerMaxInput.removeAttribute('required');
			playerSearchFields.style.opacity = '1';
			mechanicSearchFields.style.opacity = '0.5';
			mechanicInput.disabled = true;
			mechanicInput.removeAttribute('required');
		}
	}

	Array.from(searchTypeRadios).forEach(radio => radio.addEventListener('change', () => {
		updateInputEnableState();
		updateSelectedLabel();
	}));

	// Initialize enable state
	updateInputEnableState();

	// Make the selected radio label bold
	function updateSelectedLabel() {
		Array.from(searchTypeRadios).forEach(radio => {
			const label = radio.closest('label') || radio.parentElement;
			if (label) label.style.fontWeight = radio.checked ? 'bold' : 'normal';
		});
	}

	Array.from(searchTypeRadios).forEach(radio => radio.addEventListener('change', updateSelectedLabel));

	// Set initial bold state
	updateSelectedLabel();

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
		} else if (searchType === 'range') {
			const minVal = parseInt(playerMinInput.value, 10);
			const maxVal = parseInt(playerMaxInput.value, 10);
			if (isNaN(minVal) || isNaN(maxVal)) {
				resultsContainer.textContent = 'Please enter valid numeric values for the range.';
				return;
			}
			if (minVal === 0 || maxVal === 0) {
				resultsContainer.textContent = 'Values of 0 are not allowed.';
				return;
			}
			if (minVal < 0 || maxVal < 0 || minVal > 10 || maxVal > 10) {
				resultsContainer.textContent = 'Values must be between 1 and 10.';
				return;
			}
			if (minVal > maxVal) {
				resultsContainer.textContent = 'Minimum cannot be greater than maximum.';
				return;
			}
			// Include games whose player ranges overlap the requested range
			const filteredRange = games.filter(game => {
				const gMin = Number(game.min_players);
				const gMax = Number(game.max_players);
				return gMin <= maxVal && gMax >= minVal;
			});
			displayResults(filteredRange, `${minVal}-${maxVal}`, 'range');
		} else if (searchType === 'min') {
			const playerCount = parseInt(playerMinOnlyInput.value, 10);
			if (isNaN(playerCount)) {
				resultsContainer.textContent = 'Please enter a valid number.';
				return;
			}
			if (playerCount === 0) {
				resultsContainer.textContent = 'Value of 0 is not allowed.';
				return;
			}
			if (playerCount < 0 || playerCount > 10) {
				resultsContainer.textContent = 'Value must be between 1 and 10.';
				return;
			}
			const filtered = games.filter(game => Number(game.min_players) === playerCount);
			displayResults(filtered, playerCount, 'min');
		} else if (searchType === 'max') {
			const playerCount = parseInt(playerMaxOnlyInput.value, 10);
			if (isNaN(playerCount)) {
				resultsContainer.textContent = 'Please enter a valid number.';
				return;
			}
			if (playerCount === 0) {
				resultsContainer.textContent = 'Value of 0 is not allowed.';
				return;
			}
			if (playerCount < 0 || playerCount > 10) {
				resultsContainer.textContent = 'Value must be between 1 and 10.';
				return;
			}
			const filtered = games.filter(game => Number(game.max_players) === playerCount);
			displayResults(filtered, playerCount, 'max');
		}
	});

	function displayResults(games, searchValue, searchType) {
		if (!games.length) {
			if (searchType === 'mechanic') {
				resultsContainer.innerHTML = `<p>No games found with mechanic: <strong>${searchValue}</strong></p>`;
			} else if (searchType === 'range') {
				resultsContainer.innerHTML = `<p>No games found for player range: <strong>${searchValue}</strong></p>`;
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

