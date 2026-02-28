export default {
    meta: {
        name: 'mod.theme.mac_modern',
        label: 'macOS Sequoia',
        version: '1.0.0',
        kind: 'theme',
        description: 'Sleek, heavily rounded, system fonts.'
    },
    tokens: {
        '--ui-surface': '#ffffff', /* Standard window background */
        '--ui-surface-2': '#ececec', /* Desktop/behind-window tint */
        '--ui-border': '#d1d1d1',
        '--ui-text': '#000000',
        '--ui-muted': '#888888',
        '--ui-accent': '#007aff', /* Apple Blue */
        '--ui-radius': '10px',
        '--ui-gap': '16px',
        '--ui-elev': '0 10px 30px rgba(0,0,0,0.2)', /* Deep soft shadow */
        '--ui-font': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
}
