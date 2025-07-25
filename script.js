class ListingsApp {
    constructor() {
        this.listings = [];
        this.filteredListings = [];
        this.columns = [];
        this.searchTerm = '';
        this.activeFilters = {
            mothership_edition: new Set(),
            party: new Set(),
            module: new Set()
        };
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.render();
    }

    bindEvents() {
        const searchInput = document.getElementById('search-input');
        const clearButton = document.getElementById('clear-filters');
        const headerSearchToggle = document.querySelector('.header-search-toggle');
        
        searchInput.addEventListener('input', this.debounce((e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.applyFilters();
        }, 300));

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Handle header search toggle
        if (headerSearchToggle) {
            headerSearchToggle.addEventListener('click', () => {
                this.toggleSearchSection();
            });
        }
    }

    toggleSearchSection() {
        const content = document.getElementById('search-content');
        const headerToggle = document.querySelector('.header-search-toggle');
        
        if (!content || !headerToggle) return;
        
        const isHidden = content.getAttribute('aria-hidden') === 'true';
        
        content.setAttribute('aria-hidden', !isHidden);
        headerToggle.setAttribute('aria-expanded', isHidden);
        
        // Focus on search input when opening
        if (isHidden) {
            setTimeout(() => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.focus();
            }, 300);
        }
    }

    async loadData() {
        try {
            const config = window.GOOGLE_SHEETS_CONFIG;
            
            if (config.USE_SAMPLE_DATA) {
                await this.loadSampleData();
            } else {
                await this.loadFromGoogleSheets();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError();
        }
    }

    async loadSampleData() {
        // Sample data structure - replace with your Google Sheets data
        this.listings = [
            {
                id: 1,
                title: "Modern Downtown Apartment",
                category: "Housing",
                location: "Downtown",
                price: "$1,200/month",
                description: "Beautiful modern apartment in the heart of downtown with stunning city views.",
                contact: "john@example.com",
                phone: "(555) 123-4567",
                date_posted: "2024-01-15"
            },
            {
                id: 2,
                title: "Freelance Web Developer",
                category: "Jobs",
                location: "Remote",
                price: "$50/hour",
                description: "Experienced web developer available for freelance projects.",
                contact: "sarah@example.com",
                phone: "(555) 987-6543",
                date_posted: "2024-01-14"
            },
            {
                id: 3,
                title: "Vintage Dining Table",
                category: "Furniture",
                location: "Midtown",
                price: "$300",
                description: "Beautiful vintage dining table seats 6 people comfortably.",
                contact: "mike@example.com",
                phone: "(555) 456-7890",
                date_posted: "2024-01-13"
            }
        ];

        // Extract column names from the first listing
        if (this.listings.length > 0) {
            this.columns = Object.keys(this.listings[0]).filter(key => 
                !['id', 'description'].includes(key)
            );
        }

        this.filteredListings = [...this.listings];
        this.setupControls();
    }

    async loadFromGoogleSheets() {
        const config = window.GOOGLE_SHEETS_CONFIG;
        const RANGE = `${config.SHEET_NAME}!${config.RANGE}`;
        const cacheKey = `sheets_${config.SHEET_ID}_${RANGE}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            this.listings = cached.data;
            this.columns = cached.columns;
            this.filteredListings = [...this.listings];
            this.setupControls();
            return;
        }
        
        try {
            // Get basic values first
            const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${RANGE}?key=${config.API_KEY}`;
            const valuesResponse = await fetch(valuesUrl);
            
            if (!valuesResponse.ok) {
                throw new Error(`HTTP error! status: ${valuesResponse.status}`);
            }
            
            const valuesData = await valuesResponse.json();
            
            // Get detailed grid data with hyperlinks
            const gridUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}?ranges=${encodeURIComponent(RANGE)}&includeGridData=true&key=${config.API_KEY}`;
            const gridResponse = await fetch(gridUrl);
            
            if (!gridResponse.ok) {
                console.warn('Could not fetch grid data for hyperlinks, falling back to values only');
                // Fallback to values-only approach
                return this.loadFromGoogleSheetsSimple();
            }
            
            const gridData = await gridResponse.json();
            
            if (valuesData.values && valuesData.values.length > 0) {
                const headers = valuesData.values[0];
                this.columns = headers
                    .map(header => header.toLowerCase().replace(/\s+/g, '_'))
                    .filter(header => !['id'].includes(header));
                
                // Extract hyperlinks from grid data
                const gridSheet = gridData.sheets[0];
                const gridRows = gridSheet.data[0].rowData || [];
                
                this.listings = valuesData.values.slice(1).map((row, index) => {
                    const listing = { id: index + 1 };
                    const gridRow = gridRows[index + 1]; // +1 because we skip header
                    
                    headers.forEach((header, colIndex) => {
                        const cleanHeader = header.toLowerCase().replace(/\s+/g, '_');
                        let value = row[colIndex] || '';
                        
                        // Check if this cell has a hyperlink
                        if (gridRow && gridRow.values && gridRow.values[colIndex]) {
                            const cellData = gridRow.values[colIndex];
                            if (cellData.hyperlink) {
                                value = cellData.hyperlink; // Use the actual URL
                            }
                        }
                        
                        listing[cleanHeader] = value;
                    });
                    return listing;
                }).filter(listing => {
                    // Filter out completely empty rows
                    return Object.values(listing).some(value => 
                        value && String(value).trim() !== ''
                    );
                });
                
                // Cache the results
                this.cache.set(cacheKey, {
                    data: this.listings,
                    columns: this.columns,
                    timestamp: Date.now()
                });
                
                this.filteredListings = [...this.listings];
                this.setupControls();
            } else {
                throw new Error('No data found in the sheet');
            }
        } catch (error) {
            console.error('Google Sheets API Error:', error);
            throw new Error(`Failed to load data from Google Sheets: ${error.message}`);
        }
    }

    async loadFromGoogleSheetsSimple() {
        const config = window.GOOGLE_SHEETS_CONFIG;
        const RANGE = `${config.SHEET_NAME}!${config.RANGE}`;
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${RANGE}?key=${config.API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 0) {
            const headers = data.values[0];
            this.columns = headers
                .map(header => header.toLowerCase().replace(/\s+/g, '_'))
                .filter(header => !['id'].includes(header));
            
            this.listings = data.values.slice(1).map((row, index) => {
                const listing = { id: index + 1 };
                headers.forEach((header, colIndex) => {
                    const cleanHeader = header.toLowerCase().replace(/\s+/g, '_');
                    listing[cleanHeader] = row[colIndex] || '';
                });
                return listing;
            }).filter(listing => {
                return Object.values(listing).some(value => 
                    value && String(value).trim() !== ''
                );
            });
            
            this.filteredListings = [...this.listings];
            this.setupControls();
        }
    }

    setupControls() {
        this.setupFilterButtons();
    }

    setupFilterButtons() {
        // Setup Mothership Edition filters (using mothership_edition column)
        const editionValues = [...new Set(this.listings.map(listing => listing.mothership_edition))]
            .filter(value => value && value.trim())
            .sort();
        this.createFilterButtons('mothership_edition', editionValues, 'edition-filters');

        // Setup Party filters
        const partyValues = [...new Set(this.listings.map(listing => listing.party))]
            .filter(value => value && value.trim())
            .sort();
        this.createFilterButtons('party', partyValues, 'party-filters');

        // Setup Module filters
        const moduleValues = [...new Set(this.listings.map(listing => listing.module))]
            .filter(value => value && value.trim())
            .sort();
        this.createFilterButtons('module', moduleValues, 'module-filters');
    }

    createFilterButtons(filterType, values, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        values.forEach(value => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'filter-button';
            button.dataset.filterType = filterType;
            button.dataset.filterValue = value;
            
            // Format display text
            let displayText = value;
            if (filterType === 'party') {
                if (value === '3rd') displayText = '3rd Party';
                else if (value === '1st') displayText = '1st Party';
            }
            
            button.textContent = displayText;
            button.setAttribute('aria-pressed', 'false');
            
            button.addEventListener('click', () => {
                this.toggleFilter(filterType, value, button);
            });
            
            container.appendChild(button);
        });
    }

    toggleFilter(filterType, value, button) {
        const isActive = this.activeFilters[filterType].has(value);
        
        if (isActive) {
            this.activeFilters[filterType].delete(value);
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        } else {
            this.activeFilters[filterType].add(value);
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
        }
        
        this.applyFilters();
    }

    formatColumnName(column) {
        const formatted = column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Special case for author field
        if (formatted.toLowerCase().includes('author')) {
            return 'By';
        }
        
        return formatted;
    }

    applyFilters() {
        let filtered = [...this.listings];
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(listing => 
                Object.values(listing).some(value => 
                    String(value).toLowerCase().includes(this.searchTerm)
                )
            );
        }
        
        // Apply button filters
        Object.entries(this.activeFilters).forEach(([filterType, activeValues]) => {
            if (activeValues.size > 0) {
                filtered = filtered.filter(listing => {
                    const listingValue = listing[filterType];
                    return listingValue && activeValues.has(listingValue);
                });
            }
        });
        
        this.filteredListings = filtered;
        this.render();
        this.updateClearButton();
    }

    clearFilters() {
        this.searchTerm = '';
        
        // Clear all active filters
        Object.keys(this.activeFilters).forEach(filterType => {
            this.activeFilters[filterType].clear();
        });
        
        // Reset search input
        document.getElementById('search-input').value = '';
        
        // Reset all filter buttons
        document.querySelectorAll('.filter-button.active').forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        });
        
        this.filteredListings = [...this.listings];
        this.render();
        this.updateClearButton();
    }

    updateClearButton() {
        const clearButton = document.getElementById('clear-filters');
        if (!clearButton) return;
        
        const hasFilters = this.searchTerm || 
            Object.values(this.activeFilters).some(filterSet => filterSet.size > 0);
        clearButton.style.display = hasFilters ? 'block' : 'none';
    }

    render() {
        this.hideLoading();
        this.updateResultsCount();
        this.renderListings();
    }

    // Performance optimization: Lazy render listings in batches
    renderListingsLazy() {
        const grid = document.getElementById('listings-grid');
        const BATCH_SIZE = 20;
        let currentIndex = 0;

        const renderBatch = () => {
            const batch = this.filteredListings.slice(currentIndex, currentIndex + BATCH_SIZE);
            
            if (batch.length === 0) return;

            const fragment = document.createDocumentFragment();
            batch.forEach(listing => {
                const cardElement = document.createElement('div');
                cardElement.innerHTML = this.createListingCard(listing);
                const card = cardElement.firstElementChild;
                
                // Cards are self-contained, no click handlers needed
                
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
            currentIndex += BATCH_SIZE;

            // Continue rendering if there are more items
            if (currentIndex < this.filteredListings.length) {
                requestAnimationFrame(renderBatch);
            }
        };

        // Clear grid and start rendering
        grid.innerHTML = '';
        if (this.filteredListings.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <p>No listings found matching your criteria.</p>
                    <button type="button" onclick="app.clearFilters()" class="clear-button">
                        Clear filters
                    </button>
                </div>
            `;
            return;
        }

        renderBatch();
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
    }

    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }

    updateResultsCount() {
        const count = this.filteredListings.length;
        const total = this.listings.length;
        const resultsCount = document.getElementById('results-count');
        
        if (count === total) {
            resultsCount.textContent = `${total} listing${total === 1 ? '' : 's'}`;
        } else {
            resultsCount.textContent = `${count} of ${total} listing${total === 1 ? '' : 's'}`;
        }
    }

    renderListings() {
        const grid = document.getElementById('listings-grid');
        
        if (this.filteredListings.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <p>No listings found matching your criteria.</p>
                    <button type="button" onclick="app.clearFilters()" class="clear-button">
                        Clear filters
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredListings.map(listing => this.createListingCard(listing)).join('');
        
        // Cards are now self-contained, no click handlers needed
    }

    createListingCard(listing) {
        // Create pill tags for edition, mothership_edition, party, and module
        const pillTags = [];
        if (listing.edition && listing.edition.trim()) {
            pillTags.push(`<span class="pill-tag pill-edition">${this.escapeHtml(listing.edition)}</span>`);
        }
        if (listing.mothership_edition && listing.mothership_edition.trim()) {
            pillTags.push(`<span class="pill-tag pill-mothership">${this.escapeHtml(listing.mothership_edition)}</span>`);
        }
        if (listing.party && listing.party.trim()) {
            let partyText = listing.party.trim();
            if (partyText === '3rd') {
                partyText = '3rd Party';
            } else if (partyText === '1st') {
                partyText = '1st Party';
            }
            pillTags.push(`<span class="pill-tag pill-party">${this.escapeHtml(partyText)}</span>`);
        }
        if (listing.module && listing.module.trim()) {
            pillTags.push(`<span class="pill-tag pill-module">${this.escapeHtml(listing.module)}</span>`);
        }
        const pillHtml = pillTags.length > 0 ? `<div class="pill-container">${pillTags.join('')}</div>` : '';

        // Extract author field for placement under title
        const authorFields = this.columns.filter(field => 
            field.toLowerCase().includes('author') || field.toLowerCase().includes('creator')
        );
        const authorField = authorFields[0];
        const authorHtml = authorField && listing[authorField] && listing[authorField].trim() ? 
            `<div class="listing-author">By: ${this.escapeHtml(listing[authorField])}</div>` : '';

        // Display fields excluding name, author, edition, party, mothership_edition, module, notes, description, and all URL columns
        const displayFields = this.columns.filter(field => 
            !['name', 'edition', 'party', 'mothership_edition', 'module', 'notes', 'description', 'url', 'urls', 'ks/bk', 'dtrpg', 'itch.io', 'physical_'].includes(field) &&
            !field.toLowerCase().includes('author') && !field.toLowerCase().includes('creator')
        ).slice(0, 2);
        
        const metaHtml = displayFields.map(field => {
            const value = listing[field];
            if (value && value.trim()) {
                return `
                    <div class="listing-field">
                        <strong>${this.formatColumnName(field)}:</strong> ${this.escapeHtml(value)}
                    </div>
                `;
            }
            return '';
        }).join('');

        // Create URL buttons for each available link type
        const urlButtons = [];
        
        // Helper function to extract URL from cell (handles both plain URLs and hyperlink formulas)
        const extractUrl = (cellValue, listingName, columnType) => {
            if (!cellValue || !cellValue.trim()) return null;
            const trimmed = cellValue.trim();
            
            // Check if it's a plain URL
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                return trimmed;
            }
            
            // Check if it's a Google Sheets hyperlink formula: =HYPERLINK("url", "text")
            const hyperlinkMatch = trimmed.match(/=HYPERLINK\("([^"]+)"/i);
            if (hyperlinkMatch) {
                return hyperlinkMatch[1];
            }
            
            // If it contains common URL patterns but doesn't start with http
            if (trimmed.includes('.com') || trimmed.includes('.org') || trimmed.includes('.io') || trimmed.includes('kickstarter') || trimmed.includes('itch.io')) {
                // Try adding https:// if it looks like a domain
                if (!trimmed.includes('http')) {
                    return 'https://' + trimmed;
                }
            }
            
            // TEMPORARY: If the cell just contains "url", create a placeholder
            // You should replace these with actual URLs or change your sheet to use plain URLs
            if (trimmed.toLowerCase() === 'url' || trimmed.toLowerCase() === 'link') {
                // Return a placeholder that indicates the URL needs to be updated
                return '#placeholder-url-needed';
            }
            return null;
        };


        // KS/BK (Kickstarter/BackerKit)
        const ksbkUrl = extractUrl(listing['ks/bk'], listing.name, 'KS/BK');
        if (ksbkUrl) {
            const buttonClass = ksbkUrl === '#placeholder-url-needed' ? 'url-button url-kickstarter placeholder' : 'url-button url-kickstarter';
            const href = ksbkUrl === '#placeholder-url-needed' ? '#' : this.escapeHtml(ksbkUrl);
            urlButtons.push(`
                <li>
                    <a href="${href}" target="_blank" rel="noopener noreferrer" class="${buttonClass}" ${ksbkUrl === '#placeholder-url-needed' ? 'onclick="alert(\'URL not available - update your Google Sheet with actual URLs instead of hyperlinks\'); return false;"' : ''}>
                        Crowdfunding
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17"></path>
                        </svg>
                    </a>
                </li>
            `);
        }

        // DriveThruRPG
        const dtrpgUrl = extractUrl(listing.dtrpg, listing.name, 'DTRPG');
        if (dtrpgUrl) {
            const buttonClass = dtrpgUrl === '#placeholder-url-needed' ? 'url-button url-dtrpg placeholder' : 'url-button url-dtrpg';
            const href = dtrpgUrl === '#placeholder-url-needed' ? '#' : this.escapeHtml(dtrpgUrl);
            urlButtons.push(`
                <li>
                    <a href="${href}" target="_blank" rel="noopener noreferrer" class="${buttonClass}" ${dtrpgUrl === '#placeholder-url-needed' ? 'onclick="alert(\'URL not available - update your Google Sheet with actual URLs instead of hyperlinks\'); return false;"' : ''}>
                        DriveThruRPG
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17"></path>
                        </svg>
                    </a>
                </li>
            `);
        }

        // Itch.io
        const itchUrl = extractUrl(listing['itch.io'], listing.name, 'Itch.io');
        if (itchUrl) {
            const buttonClass = itchUrl === '#placeholder-url-needed' ? 'url-button url-itch placeholder' : 'url-button url-itch';
            const href = itchUrl === '#placeholder-url-needed' ? '#' : this.escapeHtml(itchUrl);
            urlButtons.push(`
                <li>
                    <a href="${href}" target="_blank" rel="noopener noreferrer" class="${buttonClass}" ${itchUrl === '#placeholder-url-needed' ? 'onclick="alert(\'URL not available - update your Google Sheet with actual URLs instead of hyperlinks\'); return false;"' : ''}>
                        Itch.io
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17"></path>
                        </svg>
                    </a>
                </li>
            `);
        }

        // Physical stores
        const physicalUrl = extractUrl(listing.physical_, listing.name, 'Physical');
        if (physicalUrl) {
            const buttonClass = physicalUrl === '#placeholder-url-needed' ? 'url-button url-stores placeholder' : 'url-button url-stores';
            const href = physicalUrl === '#placeholder-url-needed' ? '#' : this.escapeHtml(physicalUrl);
            urlButtons.push(`
                <li>
                    <a href="${href}" target="_blank" rel="noopener noreferrer" class="${buttonClass}" ${physicalUrl === '#placeholder-url-needed' ? 'onclick="alert(\'URL not available - update your Google Sheet with actual URLs instead of hyperlinks\'); return false;"' : ''}>
                        Physical Store
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17"></path>
                        </svg>
                    </a>
                </li>
            `);
        }

        // Also check for generic url/urls fields
        const genericUrl = extractUrl(listing.url || listing.urls);
        if (genericUrl) {
            urlButtons.push(`
                <li>
                    <a href="${this.escapeHtml(genericUrl)}" target="_blank" rel="noopener noreferrer" class="url-button">
                        Visit Link
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17"></path>
                        </svg>
                    </a>
                </li>
            `);
        }

        const urlHtml = urlButtons.length > 0 ? `
            <div class="listing-urls">
                <ul>
                    ${urlButtons.join('')}
                </ul>
            </div>
        ` : '';

        return `
            <div class="listing-card">
                <h3 class="listing-title">${this.escapeHtml(listing.name || listing.title || 'Untitled Listing')}</h3>
                ${authorHtml}
                ${pillHtml}
                <div class="listing-meta">
                    ${metaHtml}
                </div>
                <p class="listing-description">${this.escapeHtml(listing.notes || listing.description || 'No description available')}</p>
                ${urlHtml}
            </div>
        `;
    }


    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ListingsApp();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ListingsApp;
}