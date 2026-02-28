/**
 * Daily Content Widget Module
 * Provides a Daily Joke, Word, Quote, Recipe, or Meme.
 */
export default {
    meta: {
        name: 'widgets.daily',
        version: '1.0.0',
        author: 'ProDashboard Community',
        description: 'A daily rotating content feed that can display Jokes, Quotes, Words, Recipes, or Memes. Add it multiple times to build a complete newspaper dashboard!',
        kind: 'widget',
        category: 'Lifestyle',
        icon: '📰',
        label: 'Daily Content Feed'
    },

    // Default configuration when a user creates a new instance of this widget
    defaultConfig: {
        feedType: 'quote', // options: 'quote', 'joke', 'word', 'recipe', 'meme'
        showIcon: true,
        updateInterval: 1000 * 60 * 60 * 24 // 24 hours
    },

    init(ctx) {
        this.ctx = ctx;
        console.log('[Widget: Daily Content] Initialized');
        
        ctx.events.on('widgets:daily:refresh', () => {
            console.log("Daily widget forcefully refreshed.");
        });
    },

    // Returns HTML for the Widget Store configuration panel
    configurator(ctx, currentConfig) {
        const c = Object.assign({}, this.defaultConfig, currentConfig);
        return `
            <h4 style="margin-top:0; color:var(--ui-text);">🗞️ Daily Content Preferences</h4>
            <div style="margin-bottom: 12px;">
                <label style="display:block; font-size:0.85em; font-weight:bold; color:var(--ui-muted); margin-bottom:4px;">Content Feed Type</label>
                <select id="w-daily-type" style="width: 100%; padding: 8px; border: 1px solid var(--ui-border); border-radius: 6px; background: var(--ui-surface); color: var(--ui-text); font-weight: bold;">
                    <option value="quote" ${c.feedType === 'quote' ? 'selected' : ''}>Inspirational Quote</option>
                    <option value="joke" ${c.feedType === 'joke' ? 'selected' : ''}>Joke of the Day</option>
                    <option value="dadjoke" ${c.feedType === 'dadjoke' ? 'selected' : ''}>Dad Joke</option>
                    <option value="word" ${c.feedType === 'word' ? 'selected' : ''}>Word of the Day</option>
                    <option value="recipe" ${c.feedType === 'recipe' ? 'selected' : ''}>Recipe Idea</option>
                    <option value="book" ${c.feedType === 'book' ? 'selected' : ''}>Top Book Idea</option>
                    <option value="meme" ${c.feedType === 'meme' ? 'selected' : ''}>Meme of the Day</option>
                    <option value="cartoon" ${c.feedType === 'cartoon' ? 'selected' : ''}>Daily Cartoon</option>
                </select>
                <small style="color:var(--ui-muted); display:block; margin-top:4px;">Note: You can add this widget to your dashboard multiple times with different feeds.</small>
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--ui-text); font-size:0.9em;">
                    <input type="checkbox" id="w-daily-icon" ${c.showIcon ? 'checked' : ''}>
                    Show Thematic Icon Header
                </label>
            </div>
        `;
    },

    // Mounts event listeners after the configurator HTML is injected into the DOM
    onConfigMount(el, ctx, existingConfig) {
        const typeSelect  = el.querySelector('#w-daily-type');
        const colSelect   = el.querySelector('#w-new-col');
        const rowSelect   = el.querySelector('#w-new-row');

        if (!typeSelect || !colSelect || !rowSelect) return;

        const applySizeDefaults = (val) => {
            if (val === 'meme') { colSelect.value = '1'; rowSelect.value = '4'; }
            else if (val === 'cartoon') { colSelect.value = '1'; rowSelect.value = '3'; }
            else if (val === 'recipe') { colSelect.value = '1'; rowSelect.value = '2'; }
            else { colSelect.value = '1'; rowSelect.value = '1'; }
        };

        // If this is a fresh widget creation (not an edit), impose optimal default bounds immediately
        if (!existingConfig || Object.keys(existingConfig).length === 0) {
            applySizeDefaults(typeSelect.value);
        }

        // Listen for live dropdown changes and magically snap the gallery bounds
        typeSelect.addEventListener('change', (e) => {
            applySizeDefaults(e.target.value);
        });
    },

    // Extracts values from the configurator HTML and returns a config object
    extractConfig(el) {
        return {
            feedType: el.querySelector('#w-daily-type').value,
            showIcon: el.querySelector('#w-daily-icon').checked
        };
    },

    // Fetches the data (simulated APIs for reliability, as free APIs constantly rate-limit)
    // Production ready: Replace with standard unauthenticated endpoints if required.
    async _fetchData(type) {
        // Fallback static pools for extreme reliability
        const JOKES = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "I'm reading a book on anti-gravity. It's impossible to put down.",
            "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
            "Why did the invisible man turn down the job offer? He couldn't see himself doing it.",
            "I told my doctor that I broke my arm in two places. He told me to stop going to those places.",
            "What do you call a fake noodle? An impasta."
        ];
        
        const DAD_JOKES = [
            "I'm afraid for the calendar. Its days are numbered.",
            "My wife said I should do lunges to stay in shape. That would be a big step forward.",
            "Why do fathers take an extra pair of socks when they go golfing? In case they get a hole in one!",
            "Singing in the shower is fun until you get soap in your mouth. Then it's a soap opera.",
            "I thought the dryer was shrinking my clothes. Turns out it was the refrigerator all along.",
            "How do you follow Will Smith in the snow? You follow the fresh prints."
        ];

        const QUOTES = [
            { q: "The only limit to our realization of tomorrow will be our doubts of today.", a: "Franklin D. Roosevelt" },
            { q: "Do what you can, with what you have, where you are.", a: "Theodore Roosevelt" },
            { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
            { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
            { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" }
        ];

        const WORDS = [
            { w: "Ephemeral", d: "Lasting for a very short time." },
            { w: "Serendipity", d: "The occurrence of events by chance in a happy or beneficial way." },
            { w: "Obfuscate", d: "To render obscure, unclear, or unintelligible." },
            { w: "Mellifluous", d: "A sound that is sweet and smooth, pleasing to hear." },
            { w: "Quixotic", d: "Exceedingly idealistic; unrealistic and impractical." }
        ];

        const RECIPES = [
            { name: "Avocado Toast", desc: "Mash avocado with salt, pepper, and lime juice. Spread on thick artisanal sourdough. Top with red pepper flakes and a poached egg." },
            { name: "Garlic Butter Pasta", desc: "Boil spaghetti. In a pan, melt butter with minced garlic. Toss pasta in garlic butter, add parmesan cheese and parsley." },
            { name: "Caprese Salad", desc: "Layer thick slices of fresh mozzarella and tomatoes. Drizzle with balsamic glaze and olive oil. Snip fresh basil over top." },
            { name: "Sheet Pan Fajitas", desc: "Slice bell peppers, onions, and chicken. Toss in oil and fajita seasoning. Bake at 400F for 25 minutes. Serve with tortillas." },
            { name: "10-Min Quesadilla", desc: "Place a large tortilla in a skillet. Fill half with cheese, black beans, and salsa. Fold over, cook until crispy on both sides." }
        ];

        const BOOKS = [
            { title: "Atomic Habits", author: "James Clear", desc: "An easy and proven way to build good habits and break bad ones." },
            { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", desc: "A deep dive into the two systems that drive the way we think." },
            { title: "Project Hail Mary", author: "Andy Weir", desc: "A lone astronaut must save the earth from disaster in this sci-fi thriller." },
            { title: "Dune", author: "Frank Herbert", desc: "A stunning blend of adventure and mysticism, environmentalism and politics." },
            { title: "The Martian", author: "Andy Weir", desc: "An astronaut is stranded on Mars and must use his ingenuity to survive." }
        ];

        // Ensure these URLs are reliable and cors-friendly. For memes/cartoons, using placeholder images or established robust CDNs.
        const MEMES = [
            "https://i.imgflip.com/1ur9b0.jpg", // Distracted Boyfriend
            "https://i.imgflip.com/4t0m5.jpg",  // Doge
            "https://i.imgflip.com/1bij.jpg",   // One Does Not Simply
            "https://i.imgflip.com/261o3j.jpg", // Is This a Pigeon?
            "https://i.imgflip.com/2bpmic.jpg", // Surprised Pikachu
            "https://i.imgflip.com/1h7inm.jpg", // Roll Safe
            "https://i.imgflip.com/3098cg.jpg", // Woman Yelling at Cat
            "https://i.imgflip.com/1g8my4.jpg", // Two Buttons
            "https://i.imgflip.com/1otk96.jpg", // Expanding Brain
            "https://i.imgflip.com/24y43o.jpg", // Change My Mind
            "https://i.imgflip.com/1wz1x.jpg",  // First World Problems
            "https://i.imgflip.com/9ehk.jpg",   // Success Kid
            "https://i.imgflip.com/1ooaki.jpg", // Left Exit 12 Off Ramp
            "https://i.imgflip.com/1bhm.jpg"    // Grumpy Cat
        ];

        const CARTOONS = [
            "https://imgs.xkcd.com/comics/python.png",
            "https://imgs.xkcd.com/comics/compiling.png",
            "https://imgs.xkcd.com/comics/tech_support_cheat_sheet.png",
            "https://imgs.xkcd.com/comics/duty_calls.png",
            "https://imgs.xkcd.com/comics/standards.png",
            "https://imgs.xkcd.com/comics/exploits_of_a_mom.png",
            "https://imgs.xkcd.com/comics/sudo.png",
            "https://imgs.xkcd.com/comics/password_strength.png",
            "https://imgs.xkcd.com/comics/git.png",
            "https://imgs.xkcd.com/comics/estimation.png",
            "https://imgs.xkcd.com/comics/tar.png",
            "https://imgs.xkcd.com/comics/goto.png"
        ];

        // Seed mathematically to tie to the exact day of the year, creating a true "Daily" effect across reloads
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        let result = {};
        
        try {
            switch(type) {
                case 'joke':
                case 'dadjoke':
                    try {
                        const res = await fetch('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } });
                        if (!res.ok) throw new Error("API Offline");
                        const data = await res.json();
                        result = { text: data.joke, author: '' };
                    } catch(e) {
                        const pool = type === 'joke' ? JOKES : DAD_JOKES;
                        result = { text: pool[dayOfYear % pool.length], author: '' };
                    }
                    break;
                case 'quote':
                    try {
                        const res = await fetch('https://api.quotable.io/random');
                        if (!res.ok) throw new Error("API Offline");
                        const data = await res.json();
                        result = { text: data.content, author: data.author };
                    } catch(e) {
                        const qObj = QUOTES[dayOfYear % QUOTES.length];
                        result = { text: qObj.q, author: qObj.a };
                    }
                    break;
                case 'word':
                    try {
                        const res = await fetch('https://random-word-api.herokuapp.com/word');
                        if (!res.ok) throw new Error("API Offline");
                        const data = await res.json();
                        result = { text: data[0], author: 'Vocabulary Builder' };
                    } catch(e) {
                        const wObj = WORDS[dayOfYear % WORDS.length];
                        result = { text: wObj.w, author: wObj.d };
                    }
                    break;
                case 'recipe':
                    const rObj = RECIPES[dayOfYear % RECIPES.length];
                    result = { text: rObj.desc, author: rObj.name }; // Using author slot for name
                    break;
                case 'book':
                    const bObj = BOOKS[dayOfYear % BOOKS.length];
                    result = { text: bObj.desc, author: bObj.title + " by " + bObj.author };
                    break;
                case 'meme':
                    result = { image: MEMES[dayOfYear % MEMES.length] };
                    break;
                case 'cartoon':
                    result = { image: CARTOONS[dayOfYear % CARTOONS.length] };
                    break;
                default:
                    result = { text: "Select a valid feed.", author: "" };
            }
        } catch (e) {
            result = { text: "Error loading daily content.", author: "System" };
        }

        return result;
    },

    // Renders the live widget to the grid
    renderWidget(ctx, widgetData) {
        const config = Object.assign({}, this.defaultConfig, widgetData.config || {});
        
        const body = document.createElement('div');
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.height = '100%';
        body.style.width = '100%';
        body.style.background = 'var(--ui-surface-2)';
        body.style.color = 'var(--ui-text)';
        body.style.padding = '8px 16px 16px 16px';
        body.style.boxSizing = 'border-box';
        body.style.overflow = 'hidden';
        body.style.position = 'relative';
        body.style.containerType = 'inline-size';

        const map = {
            'quote': { icon: '✨', bgHsl: '45, 100%, 50%', label: 'Daily Quote' },
            'joke': { icon: '😆', bgHsl: '330, 100%, 60%', label: 'Daily Joke' },
            'dadjoke': { icon: '🥸', bgHsl: '30, 100%, 55%', label: 'Dad Joke' },
            'word': { icon: '📚', bgHsl: '210, 100%, 60%', label: 'Word of the Day' },
            'recipe': { icon: '🍳', bgHsl: '15, 100%, 60%', label: 'Daily Recipe' },
            'book': { icon: '📖', bgHsl: '280, 100%, 60%', label: 'Featured Book Idea' },
            'meme': { icon: '🎭', bgHsl: '180, 100%, 50%', label: 'Daily Meme' },
            'cartoon': { icon: '🎨', bgHsl: '120, 100%, 50%', label: 'Classic Cartoon' }
        };

        const theme = map[config.feedType] || map['quote'];

        // Optional Top Banner
        if (config.showIcon) {
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.gap = '8px';
            header.style.opacity = '0.8';
            header.style.fontWeight = 'bold';
            header.style.fontSize = '0.85em';
            header.style.textTransform = 'uppercase';
            header.style.letterSpacing = '1px';
            header.innerHTML = `<span style="font-size:1.4em;">${theme.icon}</span> <span>${theme.label}</span>`;
            body.appendChild(header);

            const hr = document.createElement('div');
            hr.style.height = '1px';
            hr.style.background = `hsla(${theme.bgHsl}, 0.3)`;
            hr.style.marginTop = '6px';
            hr.style.marginBottom = '6px';
            hr.style.flexShrink = '0';
            body.appendChild(hr);
        }

        const contentWrapper = document.createElement('div');
        contentWrapper.style.flex = '1';
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        contentWrapper.style.position = 'relative';
        contentWrapper.style.zIndex = '2';

        const mainText = document.createElement('div');
        // Container Query scaling for 1x1 fit
        mainText.style.fontSize = config.feedType === 'word' ? 'min(1.8rem, 15cqw)' : 'min(1.1rem, 10cqw)';
        mainText.style.fontWeight = config.feedType === 'word' ? '900' : '600';
        mainText.style.lineHeight = '1.4';
        mainText.style.fontStyle = config.feedType === 'quote' ? 'italic' : 'normal';
        mainText.style.marginBottom = '8px';
        mainText.style.display = '-webkit-box';
        mainText.style.webkitLineClamp = '6';
        mainText.style.webkitBoxOrient = 'vertical';
        mainText.style.overflow = 'hidden';
        contentWrapper.appendChild(mainText);

        const subText = document.createElement('div');
        subText.style.fontSize = 'min(0.9rem, 8cqw)';
        subText.style.opacity = '0.7';
        subText.style.fontWeight = 'bold';
        subText.style.lineHeight = '1.3';
        subText.style.display = '-webkit-box';
        subText.style.webkitLineClamp = '4';
        subText.style.webkitBoxOrient = 'vertical';
        subText.style.overflow = 'hidden';
        contentWrapper.appendChild(subText);

        const imgEl = document.createElement('img');
        imgEl.style.display = 'none';
        imgEl.style.maxWidth = '100%';
        imgEl.style.maxHeight = '100%';
        imgEl.style.objectFit = 'contain';
        imgEl.style.borderRadius = '8px';
        imgEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        
        // For Image-based feeds
        if (config.feedType === 'meme' || config.feedType === 'cartoon') {
            contentWrapper.style.justifyContent = 'center';
            contentWrapper.style.alignItems = 'center';
            mainText.style.display = 'none';
            subText.style.display = 'none';
            imgEl.style.display = 'block';
            contentWrapper.appendChild(imgEl);
            
            // Image Enlarge Modal
            imgEl.style.cursor = 'zoom-in';
            imgEl.onclick = () => {
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.background = 'rgba(0,0,0,0.85)';
                modal.style.backdropFilter = 'blur(4px)';
                modal.style.zIndex = '999999';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.cursor = 'zoom-out';
                
                const largeImg = document.createElement('img');
                largeImg.src = imgEl.src;
                largeImg.style.maxWidth = '90vw';
                largeImg.style.maxHeight = '90vh';
                largeImg.style.objectFit = 'contain';
                largeImg.style.borderRadius = '8px';
                largeImg.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
                
                modal.appendChild(largeImg);
                modal.onclick = () => modal.remove();
                document.body.appendChild(modal);
            };
        }

        // Watermark Icon background
        const watermark = document.createElement('div');
        watermark.style.position = 'absolute';
        watermark.style.bottom = '-10%';
        watermark.style.right = '-5%';
        watermark.style.fontSize = '12rem';
        watermark.style.opacity = '0.04';
        watermark.style.pointerEvents = 'none';
        watermark.style.zIndex = '1';
        watermark.textContent = theme.icon;
        
        // Dynamic Accent Bar
        const bar = document.createElement('div');
        bar.style.position = 'absolute';
        bar.style.left = '0';
        bar.style.top = '0';
        bar.style.bottom = '0';
        bar.style.width = '4px';
        bar.style.background = `hsla(${theme.bgHsl}, 0.8)`;
        bar.style.borderRadius = '4px 0 0 4px';

        body.appendChild(contentWrapper);
        body.appendChild(watermark);
        body.appendChild(bar);

        // Load content instantly
        this._fetchData(config.feedType).then(data => {
            if (config.feedType === 'meme' || config.feedType === 'cartoon') {
                imgEl.src = data.image;
            } else if (config.feedType === 'quote') {
                mainText.textContent = `"${data.text}"`;
                subText.textContent = `— ${data.author}`;
            } else if (config.feedType === 'joke' || config.feedType === 'dadjoke') {
                mainText.textContent = data.text;
                subText.textContent = '';
            } else if (config.feedType === 'word') {
                mainText.textContent = data.text;
                subText.textContent = data.author; // Using author field for definition
            } else if (config.feedType === 'recipe' || config.feedType === 'book') {
                mainText.textContent = data.author; // Using author field for title
                subText.textContent = data.text;    // Using text field for instructions/desc
                subText.style.fontWeight = 'normal';
            }
        });

        return body;
    }
};
