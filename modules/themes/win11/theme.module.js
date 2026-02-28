export default {
    meta: {
        name: 'mod.theme.win11',
        label: 'Windows 11',
        version: '1.0.0',
        kind: 'theme',
        description: 'Soft pastel accents, rounded corners, and mica-like surfaces.'
    },
    tokens: {
        '--ui-surface': '#ffffff', /* Would ideally be translucent with backdrop-filter, keeping solid for TRD safety MVP */
        '--ui-surface-2': '#f3f3f3',
        '--ui-border': '#e5e5e5',
        '--ui-text': '#202020',
        '--ui-muted': '#5c5c5c',
        '--ui-accent': '#0067c0',
        '--ui-radius': '8px', /* Rounded corners heavily featured */
        '--ui-gap': '12px',
        '--ui-elev': '0 8px 16px rgba(0,0,0,0.14)', /* Soft fluent shadow */
        '--ui-font': '"Segoe UI Variable", "Segoe UI", sans-serif'
    }
}
