// i18n System for HTML Website
(function() {
    'use strict';

    let translations = {};
    let currentLang = localStorage.getItem('lang') || 'vi';
    
    // Get page name from current URL
    function getPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        if (filename === 'index.html' || filename === '' || filename === '/') {
            return 'index';
        }
        return filename.replace('.html', '');
    }
    
    // Language switcher element
    function createLanguageSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        switcher.innerHTML = `
            <button class="lang-btn ${currentLang === 'vi' ? 'active' : ''}" data-lang="vi">VI</button>
            <span class="lang-separator">|</span>
            <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        `;
        return switcher;
    }

    // Load translation file
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json`);
            }
            translations = await response.json();
            return translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            return null;
        }
    }

    // Translate a single element
    function translateElement(element) {
        // Handle placeholder
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
            const placeholderTranslation = getNestedTranslation(translations, placeholderKey);
            if (placeholderTranslation !== undefined) {
                element.placeholder = placeholderTranslation;
            }
        }

        // Handle main translation
        const key = element.getAttribute('data-i18n');
        if (!key) return;

        const translation = getNestedTranslation(translations, key);
        if (translation !== undefined) {
            if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                element.value = translation;
                element.textContent = translation;
            } else if (element.tagName === 'BUTTON') {
                element.textContent = translation;
                if (element.hasAttribute('value')) {
                    element.value = translation;
                }
            } else if (element.hasAttribute('data-i18n-title')) {
                element.title = translation;
            } else if (element.hasAttribute('data-i18n-aria-label')) {
                element.setAttribute('aria-label', translation);
            } else {
                element.textContent = translation;
            }
        }
    }

    // Get nested translation value
    function getNestedTranslation(obj, path) {
        return path.split('.').reduce((current, prop) => {
            return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
    }

    // Translate all elements
    function translatePage() {
        // Update HTML lang attribute
        document.documentElement.lang = currentLang;

        // Update meta description if exists
        const pageName = getPageName();
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && translations.meta && translations.meta[pageName] && translations.meta[pageName].description) {
            metaDesc.content = translations.meta[pageName].description;
        }

        // Update page title
        if (translations.meta && translations.meta[pageName] && translations.meta[pageName].title) {
            document.title = translations.meta[pageName].title;
        } else if (translations.meta && translations.meta.title) {
            document.title = translations.meta.title;
        }

        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(translateElement);
        
        // Translate all elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(translateElement);
        
        // Translate option elements in select
        document.querySelectorAll('select option[data-i18n]').forEach(option => {
            const key = option.getAttribute('data-i18n');
            const translation = getNestedTranslation(translations, key);
            if (translation !== undefined) {
                option.textContent = translation;
            }
        });
    }

    // Initialize i18n
    async function init() {
        // Add language switcher to footer
        const footer = document.querySelector('.footer');
        const footerBottom = document.querySelector('.footer-bottom');
        if (footer && footerBottom) {
            const existingSwitcher = footer.querySelector('.language-switcher');
            if (!existingSwitcher) {
                const switcher = createLanguageSwitcher();
                // Insert before footer-bottom
                footerBottom.parentNode.insertBefore(switcher, footerBottom);
                
                // Add event listeners to language buttons
                switcher.querySelectorAll('.lang-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const lang = e.target.getAttribute('data-lang');
                        await changeLanguage(lang);
                    });
                });
            }
        }

        // Load and apply translations
        await loadTranslations(currentLang);
        translatePage();
    }

    // Change language
    async function changeLanguage(lang) {
        if (lang === currentLang) return;

        currentLang = lang;
        localStorage.setItem('lang', lang);

        // Update active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        // Load and apply new translations
        await loadTranslations(lang);
        translatePage();

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Public API
    window.i18n = {
        init: init,
        changeLanguage: changeLanguage,
        t: function(key) {
            return getNestedTranslation(translations, key) || key;
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

