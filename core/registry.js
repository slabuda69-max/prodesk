/**
 * Core LTS - Dynamic Module Loader and Registry
 * Responsible for loading modules via dynamic import and orchestrating their lifecycles.
 */

export class ModuleRegistry {
    constructor(appCtx) {
        this.ctx = appCtx;
        this.modules = new Map(); // Store instantiated modules by meta.name
    }

    /**
     * Dynamically loads a module from the given relative path.
     * Enforces TRD §4: resolves with new URL(url, document.baseURI).href
     * 
     * @param {string} relativePath - Path to the module (e.g. 'modules/themes/classic/theme.module.js')
     */
    async loadModule(relativePath) {
        try {
            // Ensure absolute resolution based on current document location
            const absoluteUrl = new URL(relativePath, document.baseURI).href;
            
            // Native dynamic import
            const imported = await import(absoluteUrl);
            const moduleDef = imported.default;

            if (!moduleDef || !moduleDef.meta || !moduleDef.meta.name) {
                throw new Error(`Invalid module exported from ${relativePath}. Must export default with meta.name.`);
            }

            const name = moduleDef.meta.name;
            
            if (this.modules.has(name)) {
                console.warn(`Module ${name} is already registered.`);
                return this.modules.get(name);
            }

            // Call optional init hook
            if (typeof moduleDef.init === 'function') {
                await moduleDef.init(this.ctx);
            }

            this.modules.set(name, moduleDef);
            return moduleDef;

        } catch (error) {
            console.error(`[Registry] Failed to load module at ${relativePath}:`, error);
            // TRD §10: Surface errors. We emit to appCtx so admin/UI can display it.
            this.ctx.events.emit('core:error', { 
                source: 'Registry.loadModule', 
                message: error.message,
                path: relativePath
            });
            throw error;
        }
    }

    /**
     * Get a loaded module by its strictly checked name.
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Return all loaded modules as an array
     */
    getAllModules() {
        return Array.from(this.modules.values());
    }
}
