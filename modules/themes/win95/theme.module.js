export default {
    meta: {
        name: 'mod.theme.win95',
        label: 'Windows 95',
        version: '1.0.0',
        kind: 'theme',
        description: 'Nostalgic teal backgrounds and sharp bevels.'
    },
    tokens: {
        '--ui-surface': '#c0c0c0',
        '--ui-surface-2': '#008080', /* The classic teal desktop */
        '--ui-border': '#dfdfdf', /* Rely on box-shadow for bevel effect where possible */
        '--ui-text': '#000000',
        '--ui-muted': '#808080',
        '--ui-accent': '#000080', /* Navy blue title bars */
        '--ui-radius': '0px',
        '--ui-gap': '8px',
        '--ui-elev': 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px grey, inset 2px 2px #fff', /* Classic Win95 bevel */
        '--ui-font': '"MS Sans Serif", "Pixelated MS Sans Serif", Arial, sans-serif'
    }
}
