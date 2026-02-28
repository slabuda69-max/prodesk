export default {
    meta: {
        name: 'mod.theme.light',
        label: 'Light Mode',
        version: '1.0.0',
        kind: 'theme',
        description: 'Clean, bright, high-contrast.'
    },
    tokens: {
        '--ui-surface': '#ffffff',
        '--ui-surface-2': '#e0e5ec', /* Slightly deeper cool grey background */
        '--ui-border': '#cdd4e0',
        '--ui-text': '#111827',
        '--ui-muted': '#6b7280',
        '--ui-accent': '#10b981', /* Emerald green accent */
        '--ui-radius': '8px',
        '--ui-gap': '16px',
        '--ui-elev': '0 2px 4px rgba(0,0,0,0.05)',
        '--ui-font': 'system-ui, -apple-system, sans-serif'
    }
}
