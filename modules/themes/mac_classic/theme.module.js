export default {
    meta: {
        name: 'mod.theme.mac_classic',
        label: 'Mac OS 9',
        version: '1.0.0',
        kind: 'theme',
        description: 'Platinum interfaces from the golden era.'
    },
    tokens: {
        '--ui-surface': '#dddddd', /* Platinum grey */
        '--ui-surface-2': '#e8e8e8',
        '--ui-border': '#888888',
        '--ui-text': '#000000',
        '--ui-muted': '#555555',
        '--ui-accent': '#6666cc', /* Classic Mac OS light purple/blue highlight */
        '--ui-radius': '2px',
        '--ui-gap': '12px',
        '--ui-elev': '2px 2px 0px rgba(0,0,0,0.5)', /* Hard drop shadow */
        '--ui-font': '"Charcoal", "Chicago", "Geneva", sans-serif'
    }
}
