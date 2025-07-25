# Mothers Blackbox

A modern, sci-fi themed static website for browsing and discovering Mothership RPG modules, adventures, and supplements. Features advanced search, filtering, and a cassette futurism aesthetic perfect for the cosmic horror setting.

🚀 **[Live Site](https://greglgomez.github.io/mothers-blackbox/)** (Update this URL when deployed)

## Features

- 🛸 **Sci-Fi Aesthetic** - Cassette futurism inspired design with terminal-style interface  
- 📊 **Google Sheets Integration** - Automatically fetches data from Google Sheets
- 🔍 **Advanced Search** - Real-time search across all listing fields
- 🎛️ **Smart Filtering** - Multi-select filters by edition, party, and module type
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ♿ **Accessible** - Full ARIA support and keyboard navigation
- 🚀 **Performance Optimized** - Lazy loading, caching, and efficient rendering
- 🔗 **SEO Friendly** - Complete meta tags and structured data

## Quick Start

### For Users
Simply visit the [live site](https://greglgomez.github.io/mothers-blackbox/) to browse Mothership RPG content!

### For Developers

1. **Clone the repository**
   ```bash
   git clone https://github.com/greglgomez/mothers-blackbox.git
   cd mothers-blackbox
   ```

2. **Set up local configuration**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your Google Sheets credentials
   ```

3. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   # Or use a local server like:
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

## Google Sheets Setup

### Option 1: Use Existing Data
The site automatically connects to our curated Mothership RPG database. No setup required!

### Option 2: Use Your Own Data

1. **Create a Google Sheet** with your data
   - First row should contain column headers
   - Make the sheet publicly viewable
   - Include columns like: name, author, edition, party, module, notes, etc.
   - URL columns: ks/bk, dtrpg, itch.io, physical_

2. **Get Google Sheets API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable the Google Sheets API
   - Create credentials (API Key)
   - Restrict the key to Google Sheets API for security

3. **Configure the site**
   - Copy `config.example.js` to `config.js`
   - Add your `SHEET_ID` (from the Google Sheets URL)
   - Add your `API_KEY`
   - Adjust `SHEET_NAME` and `RANGE` if needed

## Deployment

### GitHub Pages (Recommended)

1. **Fork this repository**

2. **Add your credentials as repository secrets**
   - Go to Settings > Secrets and variables > Actions
   - Add `GOOGLE_SHEET_ID` with your sheet ID
   - Add `GOOGLE_API_KEY` with your API key

3. **Enable GitHub Pages**
   - Go to Settings > Pages
   - Select "GitHub Actions" as the source
   - The site will automatically deploy on every push to main

4. **Update the footer link**
   - Edit `index.html` to point to your repository
   - Replace the placeholder GitHub link

### Other Static Hosts
The site works with any static file host:
- Netlify
- Vercel  
- Firebase Hosting
- AWS S3 + CloudFront

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # All CSS styles (sci-fi theme)
├── script.js           # Main JavaScript application
├── config.js           # Google Sheets configuration (generated)
├── config.example.js   # Template configuration file
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
└── README.md           # This file
```

## Data Structure

The application automatically adapts to your Google Sheets columns. Special handling for:

- **Name/Title**: Used as the main heading
- **Author/Creator**: Displayed under the title
- **Edition/Party/Module**: Converted to colored pill tags
- **Notes/Description**: Main description text
- **URL Columns**: 
  - `ks/bk`: Crowdfunding links (Kickstarter/BackerKit)
  - `dtrpg`: DriveThruRPG links
  - `itch.io`: Itch.io links
  - `physical_`: Physical store links

## Customization

### Styling
- Modify CSS variables in `styles.css` to change colors, fonts, and spacing
- The design uses modern CSS Grid and custom properties
- Sci-fi theme includes subtle scan lines and glow effects

### Search and Filter
- Search works across all fields automatically
- Filters are generated based on unique values in each column
- Multi-select filtering with visual feedback

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

This is a community project! Contributions welcome:

- 🐛 **Bug Reports**: [Open an issue](https://github.com/greglgomez/mothers-blackbox/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/greglgomez/mothers-blackbox/discussions)
- 🔧 **Code Contributions**: Fork, create a feature branch, and submit a PR
- 📝 **Data Updates**: Contact /u/Voljega on Reddit for data additions/corrections

## Credits

- **Website**: [/u/greglgomez](https://www.reddit.com/user/greglgomez)
- **Data Curation**: [/u/Voljega](https://www.reddit.com/user/Voljega)
- **Community**: The amazing Mothership RPG community

## License

MIT License - feel free to use this for any purpose!

## Support

If you encounter issues:

1. Check that your Google Sheet is publicly accessible
2. Verify your API key has the correct permissions  
3. Check the browser console for error messages
4. Ensure your sheet has headers in the first row
5. [Open an issue](https://github.com/greglgomez/mothers-blackbox/issues) with details

---

*Built with ❤️ for the Mothership RPG community*