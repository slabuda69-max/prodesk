/**
 * Feature: Favorites (Milestone M3 MVP)
 * Renders categorized links into #slot-favorites.
 * Provides Admin UI for CRUD operations persisted to local storage.
 */

export default {
    meta: {
        name: 'mod.feature.favorites',
        label: 'Favorites',
        version: '1.0.0',
        kind: 'feature',
        description: 'Manage and display categorized quick links.'
    },

    // State
    data: {
        groups: [
            { id: 'ungrouped', name: 'Ungrouped', protected: true, links: [] }
        ]
    },

    // TRD §6: Optional pre-mount
    async init(ctx) {
        // Load data from storage (TRD §9: namespaced key)
        const saved = ctx.storage.read('mod.feature.favorites', 'data');
        if (saved && Array.isArray(saved.groups)) {
            // Ensure ungrouped always exists even if corrupted data
            const hasUngrouped = saved.groups.find(g => g.id === 'ungrouped');
            if (!hasUngrouped) {
                saved.groups.unshift({ id: 'ungrouped', name: 'Ungrouped', protected: true, links: [] });
            }
            this.data = saved;
        }

        // Listen for internal re-renders (useful when Admin updates data)
        ctx.events.on('favorites:refresh', () => {
            this.mount(ctx);
        });
    },

    // Save current state to local storage and emit refresh
    _save(ctx) {
        ctx.storage.write('mod.feature.favorites', 'data', this.data);
        ctx.events.emit('favorites:refresh');
    },

    // TRD §6: Render into slot(s)
    async mount(ctx) {
        const slot = ctx.slots.favorites;
        if (!slot) return;

        // Base styles for the favorites panel
        slot.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--ui-gap);">
                <h3 style="margin-bottom: calc(var(--ui-gap) / 2); padding-bottom: 4px; border-bottom: 1px solid var(--ui-border); color: var(--ui-text);">Favorites</h3>
                <div id="favorites-content" style="display: flex; flex-direction: column; gap: var(--ui-gap);"></div>
            </div>
        `;

        const container = slot.querySelector('#favorites-content');

        this.data.groups.forEach(group => {
            // Skip rendering entirely empty groups unless it's Ungrouped and the whole list is totally empty
            if (group.links.length === 0 && (group.id !== 'ungrouped' || this.data.groups.length > 1)) return;

            const groupEl = document.createElement('details');
            
            // Only show headers for actual custom groups
            if (group.id !== 'ungrouped') {
                const header = document.createElement('summary');
                header.textContent = group.name;
                header.style.fontSize = '0.85em';
                header.style.textTransform = 'uppercase';
                header.style.color = 'var(--ui-muted)';
                header.style.marginBottom = '8px';
                header.style.fontWeight = 'bold';
                header.style.letterSpacing = '0.5px';
                header.style.cursor = 'pointer';
                header.style.userSelect = 'none';
                header.style.outline = 'none';
                
                // Read from storage if this specific group should be open, default to open
                const isOpen = ctx.storage.read('mod.feature.favorites', `group_open_${group.id}`) !== false;
                if (isOpen) groupEl.open = true;

                // Save toggle state
                header.onclick = (e) => {
                    // browser toggles state after click event, so we save the opposite of current open state
                    ctx.storage.write('mod.feature.favorites', `group_open_${group.id}`, !groupEl.hasAttribute('open'));
                };

                groupEl.appendChild(header);
            } else if (group.id === 'ungrouped' && group.links.length === 0 && this.data.groups.length === 1) {
                // Total empty state
                const emptyMsg = document.createElement('div');
                emptyMsg.innerHTML = `<div style="color: var(--ui-muted); font-size: 0.9em; font-style: italic;">No favorites yet.<br>Add some via <kbd>Alt+A</kbd> Settings.</div>`;
                container.appendChild(emptyMsg);
                return;
            } else {
                // If ungrouped has links, force it open
                groupEl.open = true;
                // Add an invisible margin so ungrouped items have breathing room
                groupEl.style.marginTop = '4px';
            }

            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '4px';

            group.links.forEach((link, idx) => {
                const a = document.createElement('a');
                a.href = link.url;
                
                // M11 Link Polish: Inject custom Emojis
                const linkIcon = link.icon ? `<span style="margin-right: 8px;">${link.icon}</span>` : '';
                a.innerHTML = linkIcon + (link.label || link.url);
                
                a.target = link.newTab ? '_blank' : '_self';
                
                // M11 Link Polish: Slicker glass buttons with transform animations
                a.style.display = 'block';
                a.style.padding = '8px 12px';
                a.style.backgroundColor = 'var(--ui-surface-2)';
                
                // M11 Group Polish: Custom fonts and colors
                a.style.color = group.textColor || 'var(--ui-accent)';
                a.style.fontFamily = group.fontFamily || 'inherit';
                
                a.style.textDecoration = 'none';
                a.style.borderRadius = 'var(--ui-radius)';
                a.style.transition = 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
                a.style.wordBreak = 'break-word';
                a.style.fontSize = '0.95em';
                a.style.border = '1px solid transparent';
                
                // Jazzy Hover effect
                a.onmouseenter = () => {
                    a.style.filter = 'brightness(1.1)';
                    a.style.transform = 'translateX(4px)';
                    a.style.borderColor = 'var(--ui-border)';
                    a.style.boxShadow = 'var(--ui-elev)';
                };
                a.onmouseleave = () => {
                    a.style.filter = 'none';
                    a.style.transform = 'translateX(0)';
                    a.style.borderColor = 'transparent';
                    a.style.boxShadow = 'none';
                };

                list.appendChild(a);
            });

            groupEl.appendChild(list);
            container.appendChild(groupEl);
        });
    },

    async unmount(ctx) {
        if (ctx.slots.favorites) {
            ctx.slots.favorites.innerHTML = '';
        }
    },

    // TRD §6: Admin configuration payload
    adminSections(ctx) {
        return [{
            tab: 'Favorites',
            icon: '🔖',
            id: 'feature_favorites_manage', // CSS-safe ID, no dots
            title: 'Manage Favorites',
            hint: 'Organize your quick links into groups.',
            render: (el) => {
                this._renderAdminContent(el, ctx);
            }
        }];
    },

    // Internal Admin Render Logic (separated for readability)
    _renderAdminContent(el, ctx) {
        el.innerHTML = `
            <style>
                .fav-group-card { background: var(--ui-surface-2); border: 1px solid var(--ui-border); border-radius: var(--ui-radius); padding: var(--ui-gap); margin-bottom: var(--ui-gap); }
                .fav-group-card summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; cursor: pointer; outline: none; list-style: none; font-weight: bold; }
                .fav-group-card summary::-webkit-details-marker { display:none; }
                .fav-link-item { display:flex; align-items:center; justify-content:space-between; padding: 8px 0; border-bottom: 1px dashed var(--ui-border); }
                .fav-link-item:last-child { border-bottom: none; }
                .fav-btn { padding: 4px 8px; cursor: pointer; border: 1px solid var(--ui-border); border-radius: 4px; background: var(--ui-surface); color: var(--ui-text); }
                .fav-btn:hover { background: var(--ui-surface-2); }
                .fav-btn-danger { color: #ff4444; border-color: #ff4444; }
                .fav-btn-primary { background: var(--ui-accent); border-color: var(--ui-accent); color: white; }
                .fav-input { width: 100%; padding: 8px; margin-top: 4px; margin-bottom: 12px; border: 1px solid var(--ui-border); border-radius: var(--ui-radius); background: var(--ui-surface); color: var(--ui-text); }
            </style>
            
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom: var(--ui-gap);">
                <button id="btn-add-group" class="fav-btn fav-btn-primary">+ New Group</button>
            </div>
            
            <div id="fav-admin-groups"></div>
        `;

        const groupsContainer = el.querySelector('#fav-admin-groups');

        // Render Groups
        this.data.groups.forEach((group, gIdx) => {
            const gCard = document.createElement('details');
            gCard.className = 'fav-group-card';
            if (gIdx === 0) gCard.open = true;
            
            // Group Header (Name + Actions)
            const gHeader = document.createElement('summary');
            
            const gName = document.createElement('h4');
            gName.textContent = group.name;
            gName.style.margin = '0';
            gHeader.appendChild(gName);

            // Group Controls (Cannot delete or rename Ungrouped)
            const gControls = document.createElement('div');
            gControls.style.display = 'flex';
            gControls.style.alignItems = 'center';
            gControls.style.gap = '8px';

            // M11 Group Customizations
            if (group.id !== 'ungrouped') {
                const fontSelect = document.createElement('select');
                fontSelect.className = 'fav-input';
                fontSelect.style.margin = '0';
                fontSelect.style.padding = '4px';
                fontSelect.style.width = '120px';
                fontSelect.style.fontSize = '0.8em';
                fontSelect.innerHTML = `
                    <option value="">Default Font</option>
                    <option value="monospace">Monospace</option>
                    <option value="serif">Serif</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                `;
                fontSelect.value = group.fontFamily || '';
                fontSelect.onchange = () => {
                    group.fontFamily = fontSelect.value;
                    this._save(ctx);
                };
                gControls.appendChild(fontSelect);

                const colorSelect = document.createElement('input');
                colorSelect.type = 'color';
                colorSelect.title = 'Link Color';
                colorSelect.style.cursor = 'pointer';
                colorSelect.style.height = '26px';
                colorSelect.style.width = '30px';
                colorSelect.style.padding = '0';
                colorSelect.style.border = '1px solid var(--ui-border)';
                colorSelect.value = group.textColor || '#00ffcc'; // fallback accent color
                colorSelect.onchange = () => {
                    group.textColor = colorSelect.value;
                    this._save(ctx);
                };
                gControls.appendChild(colorSelect);
            }

            if (!group.protected) {
                const delGrpBtn = document.createElement('button');
                delGrpBtn.className = 'fav-btn fav-btn-danger';
                delGrpBtn.textContent = 'Delete';
                delGrpBtn.style.fontSize = '0.8em';
                delGrpBtn.onclick = () => {
                    if (confirm(`Delete group "${group.name}" and all its links?`)) {
                        this.data.groups.splice(gIdx, 1);
                        this._save(ctx);
                        this._renderAdminContent(el, ctx); // re-render admin
                    }
                };
                gControls.appendChild(delGrpBtn);
            }
            gHeader.appendChild(gControls);
            gCard.appendChild(gHeader);

            // Add Link Form inline
            const addForm = document.createElement('div');
            addForm.style.display = 'flex';
            addForm.style.gap = '8px';
            addForm.style.marginBottom = '12px';
            addForm.style.flexWrap = 'wrap';
            addForm.style.alignItems = 'center';
            
            addForm.innerHTML = `
                <input type="text" title="Click to open Emoji Picker" placeholder="😀" class="fav-input" style="width: 45px; margin:0; text-align:center; cursor:pointer;" id="new-icon-${group.id}" readonly>
                <input type="text" placeholder="Label" class="fav-input" style="flex: 1; min-width: 120px; margin:0;" id="new-label-${group.id}">
                <input type="url" placeholder="https://..." class="fav-input" style="flex: 2; min-width: 200px; margin:0;" id="new-url-${group.id}">
                <label style="display:flex; align-items:center; gap:4px; font-size:0.8em; color:var(--ui-muted); white-space:nowrap;">
                    <input type="checkbox" id="new-tab-${group.id}" checked> New Tab
                </label>
                <button class="fav-btn fav-btn-primary" id="btn-add-${group.id}">Add</button>
            `;
            gCard.appendChild(addForm);

            // Link List
            const linksContainer = document.createElement('div');
            if (group.links.length === 0) {
                linksContainer.innerHTML = `<div style="color:var(--ui-muted); font-size:0.85em;">No links in this group.</div>`;
            } else {
                group.links.forEach((link, lIdx) => {
                    const lRow = document.createElement('div');
                    lRow.className = 'fav-link-item';
                    
                    // State flag for this specific row
                    let isEditing = false;

                    // Read-only View
                    const lInfo = document.createElement('div');
                    lInfo.style.display = 'flex';
                    lInfo.style.alignItems = 'center';
                    
                    const linkIcon = link.icon ? `<span style="margin-right:8px; font-size:1.2em;">${link.icon}</span>` : '';
                    const targetStr = link.newTab ? ' (New Tab)' : '';
                    
                    lInfo.innerHTML = `
                        ${linkIcon}
                        <div>
                            <div style="font-weight:bold;">${link.label || 'Unnamed'} <span style="font-size:0.7em;font-weight:normal;color:var(--ui-accent);">${targetStr}</span></div>
                            <div style="font-size:0.8em; color:var(--ui-muted);">${link.url}</div>
                        </div>
                    `;

                    const groupSelectHtml = this.data.groups.map(g => `<option value="${g.id}" ${g.id === group.id ? 'selected' : ''}>${g.name}</option>`).join('');

                    // Edit View
                    const lEditForm = document.createElement('div');
                    lEditForm.style.display = 'none';
                    lEditForm.style.flex = '1';
                    lEditForm.style.gap = '8px';
                    lEditForm.style.flexWrap = 'wrap';
                    lEditForm.style.alignItems = 'center';
                    
                    lEditForm.innerHTML = `
                        <input type="text" title="Click to open Emoji Picker" placeholder="😀" class="fav-input" style="width: 45px; margin:0; text-align:center; cursor:pointer;" id="edit-icon-${group.id}-${lIdx}" value="${link.icon || ''}" readonly>
                        <input type="text" placeholder="Label" class="fav-input" style="flex: 1; min-width: 120px; margin:0;" id="edit-label-${group.id}-${lIdx}" value="${link.label || ''}">
                        <input type="url" placeholder="https://..." class="fav-input" style="flex: 2; min-width: 200px; margin:0;" id="edit-url-${group.id}-${lIdx}" value="${link.url}">
                        <select class="fav-input" style="width: auto; margin:0;" id="edit-group-${group.id}-${lIdx}">
                            ${groupSelectHtml}
                        </select>
                        <label style="display:flex; align-items:center; gap:4px; font-size:0.8em; color:var(--ui-muted); white-space:nowrap;">
                            <input type="checkbox" id="edit-tab-${group.id}-${lIdx}" ${link.newTab ? 'checked' : ''}> New Tab
                        </label>
                        <button class="fav-btn fav-btn-primary" id="btn-save-${group.id}-${lIdx}">Save</button>
                    `;
                    
                    const lControls = document.createElement('div');
                    lControls.style.display = 'flex';
                    lControls.style.gap = '4px';

                    // Edit Button
                    const btnEdit = document.createElement('button');
                    btnEdit.className = 'fav-btn';
                    btnEdit.innerHTML = '✏️ Edit';
                    btnEdit.onclick = () => {
                        isEditing = !isEditing;
                        if (isEditing) {
                            lInfo.style.display = 'none';
                            lControls.style.display = 'none';
                            lEditForm.style.display = 'flex';
                            
                            // M11: Custom Emoji Picker Trigger
                            const iconInput = lEditForm.querySelector(`#edit-icon-${group.id}-${lIdx}`);
                            iconInput.onclick = () => {
                                this._showEmojiPicker(iconInput, ctx);
                            };
                        }
                    };
                    lControls.appendChild(btnEdit);

                    // Reorder Up
                    if (lIdx > 0) {
                        const btnUp = document.createElement('button');
                        btnUp.className = 'fav-btn';
                        btnUp.innerHTML = '&#9650;'; // Up arrow
                        btnUp.onclick = () => {
                            const temp = group.links[lIdx - 1];
                            group.links[lIdx - 1] = link;
                            group.links[lIdx] = temp;
                            this._save(ctx);
                            this._renderAdminContent(el, ctx);
                        };
                        lControls.appendChild(btnUp);
                    }

                    // Reorder Down
                    if (lIdx < group.links.length - 1) {
                        const btnDn = document.createElement('button');
                        btnDn.className = 'fav-btn';
                        btnDn.innerHTML = '&#9660;'; // Down arrow
                        btnDn.onclick = () => {
                            const temp = group.links[lIdx + 1];
                            group.links[lIdx + 1] = link;
                            group.links[lIdx] = temp;
                            this._save(ctx);
                            this._renderAdminContent(el, ctx);
                        };
                        lControls.appendChild(btnDn);
                    }

                    // Delete Link
                    const btnDel = document.createElement('button');
                    btnDel.className = 'fav-btn fav-btn-danger';
                    btnDel.innerHTML = '&times;';
                    btnDel.onclick = () => {
                        group.links.splice(lIdx, 1);
                        this._save(ctx);
                        this._renderAdminContent(el, ctx);
                    };
                    lControls.appendChild(btnDel);

                    // Save Edit Logic
                    const saveBtn = lEditForm.querySelector(`#btn-save-${group.id}-${lIdx}`);
                    if (saveBtn) {
                        saveBtn.onclick = () => {
                            const newIcon = lEditForm.querySelector(`#edit-icon-${group.id}-${lIdx}`).value.trim();
                            const newLabel = lEditForm.querySelector(`#edit-label-${group.id}-${lIdx}`).value.trim();
                            let newUrl = lEditForm.querySelector(`#edit-url-${group.id}-${lIdx}`).value.trim();
                            const newGroup = lEditForm.querySelector(`#edit-group-${group.id}-${lIdx}`).value;
                            const newTab = lEditForm.querySelector(`#edit-tab-${group.id}-${lIdx}`).checked;

                            if (!newUrl) {
                                alert('URL is required.');
                                return;
                            }
                            if (!/^https?:\/\//i.test(newUrl)) {
                                newUrl = 'https://' + newUrl;
                            }

                            if (newGroup !== group.id) {
                                // Transfer to another group
                                const targetGroup = this.data.groups.find(g => g.id === newGroup);
                                if (targetGroup) {
                                    const movedLink = group.links.splice(lIdx, 1)[0];
                                    movedLink.icon = newIcon || null;
                                    movedLink.label = newLabel || newUrl;
                                    movedLink.url = newUrl;
                                    movedLink.newTab = newTab;
                                    targetGroup.links.push(movedLink);
                                }
                            } else {
                                // Update inside current group
                                link.icon = newIcon || null;
                                link.label = newLabel || newUrl;
                                link.url = newUrl;
                                link.newTab = newTab;
                            }

                            this._save(ctx);
                            this._renderAdminContent(el, ctx);
                        };
                    }

                    lRow.appendChild(lInfo);
                    lRow.appendChild(lEditForm);
                    lRow.appendChild(lControls);
                    linksContainer.appendChild(lRow);
                });
            }
            gCard.appendChild(linksContainer);

            groupsContainer.appendChild(gCard);

            // M11: Wire up Custom Emoji picker to the Add Form icon input
            const addIconInput = addForm.querySelector(`#new-icon-${group.id}`);
            addIconInput.onclick = () => {
                this._showEmojiPicker(addIconInput, ctx);
            };

            // Bind Add Event
            addForm.querySelector(`#btn-add-${group.id}`).onclick = () => {
                const iconIn = addForm.querySelector(`#new-icon-${group.id}`);
                const labelIn = addForm.querySelector(`#new-label-${group.id}`);
                const urlIn = addForm.querySelector(`#new-url-${group.id}`);
                const newTabIn = addForm.querySelector(`#new-tab-${group.id}`);
                
                const icon = iconIn.value.trim();
                let rawUrl = urlIn.value.trim();
                const label = labelIn.value.trim();
                const newTab = newTabIn.checked;

                if (!rawUrl) {
                    alert('URL is required.');
                    return;
                }
                
                // Auto-appened http:// if missing protocol to ensure valid valid links
                if (!/^https?:\/\//i.test(rawUrl)) {
                    rawUrl = 'https://' + rawUrl;
                }

                group.links.push({
                    id: Date.now().toString(),
                    icon: icon || null,
                    label: label || rawUrl,
                    url: rawUrl,
                    newTab: newTab !== false
                });

                this._save(ctx);
                this._renderAdminContent(el, ctx);
            };
        });

        // Add New Group Event
        el.querySelector('#btn-add-group').onclick = () => {
            const gName = prompt('Enter new group name:');
            if (gName && gName.trim()) {
                const safeId = gName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
                this.data.groups.push({
                    id: `grp-${safeId}-${Date.now()}`,
                    name: gName.trim(),
                    protected: false,
                    links: []
                });
                this._save(ctx);
                this._renderAdminContent(el, ctx);
            }
        };
    },

    // Custom fallback Emoji Grid overlay (fixes showPicker experiment API failures)
    _showEmojiPicker(inputEl, ctx) {
        let existing = document.getElementById('fav-emoji-picker');
        if (existing) existing.remove();

        const emojis = ['😀','😂','😊','😍','😒','😁','😔','😉','😌','😎','😭','😘','😡','😢','😣','😤','😥','😨','😩','😪','😫','😬','😮','😯','😰','😱','😲','😳','😴','😵','😶','😷','😸','😹','😺','😻','😼','😽','😾','😿','🙀','🚀','💻','📱','⌚','🎧','🎮','📺','📻','💡','🔥','✨','🎉','🌟','🏆','🎯','🎨','🎬','🎤','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','🧩','🧸'];

        const picker = document.createElement('div');
        picker.id = 'fav-emoji-picker';
        picker.style.position = 'absolute';
        picker.style.background = 'var(--ui-surface)';
        picker.style.border = '1px solid var(--ui-border)';
        picker.style.padding = '8px';
        picker.style.borderRadius = 'var(--ui-radius)';
        picker.style.boxShadow = 'var(--ui-elev)';
        picker.style.display = 'grid';
        picker.style.gridTemplateColumns = 'repeat(8, 24px)';
        picker.style.gap = '4px';
        picker.style.zIndex = '9999';
        picker.style.maxHeight = '200px';
        picker.style.overflowY = 'auto';

        const rect = inputEl.getBoundingClientRect();
        picker.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        picker.style.left = (rect.left + window.scrollX) + 'px';

        emojis.forEach(emoji => {
            const btn = document.createElement('div');
            btn.textContent = emoji;
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '1.2em';
            btn.style.textAlign = 'center';
            btn.style.padding = '2px';
            btn.style.borderRadius = '4px';
            btn.onmouseenter = () => btn.style.background = 'var(--ui-surface-2)';
            btn.onmouseleave = () => btn.style.background = 'transparent';
            btn.onclick = (e) => {
                e.stopPropagation();
                inputEl.value = emoji;
                picker.remove();
            };
            picker.appendChild(btn);
        });

        const clearBtn = document.createElement('div');
        clearBtn.textContent = '❌ Clear';
        clearBtn.title = 'Clear Emoji';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.fontSize = '0.9em';
        clearBtn.style.textAlign = 'center';
        clearBtn.style.padding = '4px';
        clearBtn.style.borderRadius = '4px';
        clearBtn.style.gridColumn = 'span 8';
        clearBtn.style.marginTop = '4px';
        clearBtn.style.borderTop = '1px solid var(--ui-border)';
        clearBtn.onmouseenter = () => clearBtn.style.background = 'var(--ui-surface-2)';
        clearBtn.onmouseleave = () => clearBtn.style.background = 'transparent';
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            inputEl.value = '';
            picker.remove();
        };
        picker.appendChild(clearBtn);

        document.body.appendChild(picker);

        setTimeout(() => {
            const closePicker = (e) => {
                if (!picker.contains(e.target) && e.target !== inputEl) {
                    picker.remove();
                    document.removeEventListener('click', closePicker);
                }
            };
            document.addEventListener('click', closePicker);
        }, 10);
    }
}
