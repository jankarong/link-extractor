// Content Script for Link Extractor Chrome Extension
// Responsible for automatically filling forms on web pages

class FormFiller {
    constructor() {
        this.debug = true; // Temporarily enable debug information to help troubleshoot issues
        this.init();
    }

    init() {
        // Listen to messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'fillForm') {
                this.fillForm(request.data);
                sendResponse({ success: true });
            } else if (request.action === 'extractContent') {
                const content = this.extractPageContent();
                sendResponse({ success: true, content });
            }

            return true; // Keep message channel open
        });

        if (this.debug) {
            console.log('Link Extractor Content Script loaded');
            console.log('Use window.testFormFields() to test field recognition');

            // Expose test method to global scope
            window.testFormFields = () => {
                const fields = this.findFormFields();
                console.log('=== Form Field Recognition Test ===');
                console.log('Product name fields:', fields.name.length, 'found');
                console.log('Website URL fields:', fields.website.length, 'found');
                console.log('Tagline fields:', fields.tagline.length, 'found');
                console.log('Description fields:', fields.description.length, 'found');
                console.log('Feature fields:', fields.features.length, 'found');
                console.log('Comment fields:', fields.comment.length, 'found');
                console.log('Logo fields:', fields.logo.length, 'found');
                console.log('Detailed information:', fields);
                return fields;
            };
        }
    }

    /**
     * Fill form
     * @param {Object} data Data to fill
     */
    fillForm(data) {
        try {
            const fields = this.findFormFields();

            if (this.debug) {
                console.log('=== Link Extractor Debug Information ===');
                console.log('Found form fields:', fields);
                console.log('Data to fill:', data);
                console.log('Website URL field count:', fields.website.length);
                if (fields.website.length > 0) {
                    console.log('Website URL field details:', fields.website.map(el => ({
                        tagName: el.tagName,
                        name: el.name,
                        id: el.id,
                        placeholder: el.placeholder,
                        className: el.className,
                        type: el.type
                    })));
                }
                console.log('==============================');
            }

            // Fill product name
            if (data.productName) {
                this.fillField(fields.name, data.productName);
            }

            // Fill website URL
            if (data.website) {
                if (this.debug) {
                    console.log(`Attempting to fill website URL: ${data.website} to ${fields.website.length} fields`);
                }
                this.fillField(fields.website, data.website);
            }

            // Fill tagline
            if (data.tagline) {
                this.fillField(fields.tagline, data.tagline);
            }

            // Fill description
            if (data.description) {
                this.fillField(fields.description, data.description);
            }

            // Fill features
            if (data.features) {
                this.fillField(fields.features, data.features);
            }

            // Fill comment
            if (data.comment) {
                this.fillField(fields.comment, data.comment);
            }

            // Handle logo
            if (data.logo) {
                this.handleLogoUpload(fields.logo, data.logo);
            }

            // Handle webpage screenshot (as general image upload)
            if (data.screenshot) {
                // Prioritize uploading screenshot as image/cover
                const imageInputs = Array.from(document.querySelectorAll('input[type="file"][accept*="image"], input[type="file"][name*="image" i], input[type="file"][id*="image" i], input[type="file"][name*="screenshot" i], input[type="file"][id*="screenshot" i]'));
                if (imageInputs.length > 0) {
                    this.handleLogoUpload(imageInputs, data.screenshot);
                }
            }

            // Trigger change events to ensure website detects changes
            this.triggerChangeEvents(fields);

            if (this.debug) {
                console.log('Form filling completed');
            }

        } catch (error) {
            console.error('Error occurred while filling form:', error);
        }
    }

    /**
     * Find form fields in the page
     * @returns {Object} Object containing various field types
     */
    findFormFields() {
        const fields = {
            name: [],
            website: [],
            tagline: [],
            description: [],
            features: [],
            comment: [],
            logo: []
        };

        // Possible selectors for product name fields
        const nameSelectors = [
            'input[name*="name" i]',
            'input[placeholder*="name" i]',
            'input[id*="name" i]',
            'input[name*="title" i]',
            'input[placeholder*="title" i]',
            'input[id*="title" i]',
            'input[name*="product" i]',
            'input[placeholder*="product" i]',
            'input[id*="product" i]',
            'input[aria-label*="name" i]',
            'input[aria-label*="title" i]'
        ];

        // Possible selectors for website URL fields
        const websiteSelectors = [
            // Basic URL fields
            'input[type="url"]',
            'input[name*="url" i]',
            'input[placeholder*="url" i]',
            'input[id*="url" i]',
            'input[class*="url" i]',

            // Website related fields
            'input[name*="website" i]',
            'input[placeholder*="website" i]',
            'input[id*="website" i]',
            'input[class*="website" i]',

            // Site related fields
            'input[name*="site" i]',
            'input[placeholder*="site" i]',
            'input[id*="site" i]',
            'input[class*="site" i]',

            // Link related fields
            'input[name*="link" i]',
            'input[placeholder*="link" i]',
            'input[id*="link" i]',
            'input[class*="link" i]',

            // Domain related fields
            'input[name*="domain" i]',
            'input[placeholder*="domain" i]',
            'input[id*="domain" i]',
            'input[class*="domain" i]',

            // Homepage related fields
            'input[name*="homepage" i]',
            'input[placeholder*="homepage" i]',
            'input[id*="homepage" i]',
            'input[name*="home" i]',
            'input[placeholder*="home" i]',
            'input[id*="home" i]',

            // Web related fields
            'input[name*="web" i]',
            'input[placeholder*="web" i]',
            'input[id*="web" i]',

            // HTTP related fields
            'input[name*="http" i]',
            'input[placeholder*="http" i]',
            'input[id*="http" i]',

            // Project related fields
            'input[name*="project" i]',
            'input[placeholder*="project" i]',
            'input[id*="project" i]',

            // Accessibility labels
            'input[aria-label*="url" i]',
            'input[aria-label*="website" i]',
            'input[aria-label*="link" i]',
            'input[aria-label*="site" i]',
            'input[aria-label*="domain" i]'
        ];

        // Possible selectors for tagline fields
        const taglineSelectors = [
            'input[name*="tagline" i]',
            'input[placeholder*="tagline" i]',
            'input[id*="tagline" i]',
            'input[name*="slogan" i]',
            'input[placeholder*="slogan" i]',
            'input[id*="slogan" i]',
            'input[name*="subtitle" i]',
            'input[placeholder*="subtitle" i]',
            'input[id*="subtitle" i]',
            'input[name*="short" i]',
            'input[placeholder*="short" i]',
            'input[aria-label*="tagline" i]',
            'input[aria-label*="slogan" i]'
        ];

        // Possible selectors for description fields
        const descriptionSelectors = [
            'textarea[name*="description" i]',
            'textarea[placeholder*="description" i]',
            'textarea[id*="description" i]',
            'textarea[name*="desc" i]',
            'textarea[placeholder*="desc" i]',
            'textarea[id*="desc" i]',
            'textarea[name*="about" i]',
            'textarea[placeholder*="about" i]',
            'textarea[id*="about" i]',
            'textarea[name*="summary" i]',
            'textarea[placeholder*="summary" i]',
            'textarea[id*="summary" i]',
            'textarea[aria-label*="description" i]',
            'input[name*="description" i]',
            'input[placeholder*="description" i]',
            'input[id*="description" i]',
            // Rich text editors
            '[contenteditable="true"]',
            '.ql-editor', // Quill editor
            '.fr-element', // Froala editor
            '.note-editable' // Summernote editor
        ];

        // Possible selectors for feature fields
        const featuresSelectors = [
            'textarea[name*="feature" i]',
            'textarea[placeholder*="feature" i]',
            'textarea[id*="feature" i]',
            'input[name*="feature" i]',
            'input[placeholder*="feature" i]',
            'input[id*="feature" i]',
            'textarea[name*="benefit" i]',
            'textarea[placeholder*="benefit" i]',
            'textarea[id*="benefit" i]',
            'textarea[name*="highlight" i]',
            'textarea[placeholder*="highlight" i]',
            'textarea[id*="highlight" i]',
            'textarea[name*="key" i]',
            'textarea[placeholder*="key" i]',
            'textarea[id*="key" i]',
            'input[name*="benefit" i]',
            'input[placeholder*="benefit" i]',
            'input[id*="benefit" i]',
            'textarea[aria-label*="feature" i]',
            'input[aria-label*="feature" i]'
        ];

        // Possible selectors for comment fields
        const commentSelectors = [
            'textarea[name*="comment" i]',
            'textarea[placeholder*="comment" i]',
            'textarea[id*="comment" i]',
            'input[name*="comment" i]',
            'input[placeholder*="comment" i]',
            'input[id*="comment" i]',
            'textarea[name*="note" i]',
            'textarea[placeholder*="note" i]',
            'textarea[id*="note" i]',
            'input[name*="note" i]',
            'input[placeholder*="note" i]',
            'input[id*="note" i]',
            'textarea[name*="reason" i]',
            'textarea[placeholder*="reason" i]',
            'textarea[id*="reason" i]',
            'textarea[name*="why" i]',
            'textarea[placeholder*="why" i]',
            'textarea[id*="why" i]',
            'textarea[name*="explain" i]',
            'textarea[placeholder*="explain" i]',
            'textarea[id*="explain" i]',
            'textarea[name*="message" i]',
            'textarea[placeholder*="message" i]',
            'textarea[id*="message" i]',
            'textarea[aria-label*="comment" i]',
            'input[aria-label*="comment" i]'
        ];

        // Possible selectors for logo upload fields
        const logoSelectors = [
            'input[type="file"][name*="logo" i]',
            'input[type="file"][id*="logo" i]',
            'input[type="file"][placeholder*="logo" i]',
            'input[type="file"][name*="image" i]',
            'input[type="file"][id*="image" i]',
            'input[type="file"][name*="icon" i]',
            'input[type="file"][id*="icon" i]',
            'input[type="file"][accept*="image"]',
            'input[type="file"][aria-label*="logo" i]',
            'input[type="file"][aria-label*="image" i]'
        ];

        // Collect all matching fields
        nameSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.name.push(el);
                }
            });
        });

        websiteSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.website.push(el);
                }
            });
        });

        taglineSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.tagline.push(el);
                }
            });
        });

        descriptionSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.description.push(el);
                }
            });
        });

        featuresSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.features.push(el);
                }
            });
        });

        commentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.comment.push(el);
                }
            });
        });

        logoSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (this.isVisible(el) && !this.isDisabled(el)) {
                    fields.logo.push(el);
                }
            });
        });

        // Remove duplicates
        Object.keys(fields).forEach(key => {
            fields[key] = [...new Set(fields[key])];
        });

        return fields;
    }

    /**
     * Fill fields
     * @param {Array} elements Array of elements to fill
     * @param {string} value Value to fill
     */
    fillField(elements, value) {
        if (!elements || elements.length === 0) return;

        elements.forEach(element => {
            try {
                if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                    // Regular input boxes and text areas
                    element.focus();
                    element.value = value;

                    // Trigger various events to ensure website detects changes
                    this.triggerEvent(element, 'input');
                    this.triggerEvent(element, 'change');
                    this.triggerEvent(element, 'blur');

                } else if (element.hasAttribute('contenteditable')) {
                    // Rich text editor
                    element.focus();
                    element.innerHTML = value.replace(/\n/g, '<br>');

                    this.triggerEvent(element, 'input');
                    this.triggerEvent(element, 'blur');
                }

                if (this.debug) {
                    console.log(`✅ Field filled: ${element.tagName}[name="${element.name || 'none'}", id="${element.id || 'none'}", placeholder="${element.placeholder || 'none'}"] = ${value}`);
                }

            } catch (error) {
                console.error('Error filling field:', error, element);
            }
        });
    }

    /**
     * Handle logo upload
     * @param {Array} elements Array of logo upload fields  
     * @param {string} logoDataUrl Logo data URL
     */
    async handleLogoUpload(elements, logoDataUrl) {
        if (!elements || elements.length === 0) return;

        try {
            // Convert Data URL to File object
            const file = await this.dataURLtoFile(logoDataUrl, 'logo.png');

            elements.forEach(element => {
                try {
                    // Create DataTransfer object to simulate file selection
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);

                    element.files = dataTransfer.files;

                    // Trigger change event
                    this.triggerEvent(element, 'change');

                    if (this.debug) {
                        console.log(`Logo uploaded to field: ${element.name || element.id}`);
                    }

                } catch (error) {
                    console.error('Error uploading logo to field:', error, element);
                }
            });

        } catch (error) {
            console.error('Error handling logo upload:', error);
        }
    }

    /**
     * Convert Data URL to File object
     * @param {string} dataurl Data URL
     * @param {string} filename Filename
     * @returns {Promise<File>} File object
     */
    dataURLtoFile(dataurl, filename) {
        return new Promise((resolve) => {
            const arr = dataurl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            const file = new File([u8arr], filename, { type: mime });
            resolve(file);
        });
    }

    /**
     * Trigger DOM event
     * @param {Element} element Target element
     * @param {string} eventType Event type
     */
    triggerEvent(element, eventType) {
        try {
            const event = new Event(eventType, {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);

            // Additionally trigger events that React/Vue frameworks might need
            if (eventType === 'input') {
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: element.value
                });
                element.dispatchEvent(inputEvent);
            }
        } catch (error) {
            if (this.debug) {
                console.warn('Failed to trigger event:', eventType, error);
            }
        }
    }

    /**
     * Trigger change events for all filled fields
     * @param {Object} fields Field objects
     */
    triggerChangeEvents(fields) {
        Object.values(fields).forEach(fieldArray => {
            fieldArray.forEach(element => {
                // Delay event triggering to give browser time to process
                setTimeout(() => {
                    this.triggerEvent(element, 'change');
                    this.triggerEvent(element, 'blur');
                }, 100);
            });
        });
    }

    /**
     * Check if element is visible
     * @param {Element} element Element to check
     * @returns {boolean} Whether visible
     */
    isVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetWidth > 0 &&
            element.offsetHeight > 0;
    }

    /**
     * Check if element is disabled
     * @param {Element} element Element to check
     * @returns {boolean} Whether disabled
     */
    isDisabled(element) {
        return element.disabled || element.readOnly;
    }

    /**
     * Extract page content (backup solution for AI analysis)
     * @returns {string} Page content
     */
    extractPageContent() {
        const title = document.title || '';
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        const h1Elements = Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent.trim());
        const h2Elements = Array.from(document.querySelectorAll('h2')).slice(0, 5).map(h2 => h2.textContent.trim());

        // Extract possible logo
        const logoImg = document.querySelector('img[alt*="logo" i], .logo img, #logo img, [class*="brand"] img');
        const logoUrl = logoImg ? new URL(logoImg.src, window.location.href).href : '';

        // Extract main content paragraphs
        const paragraphs = Array.from(document.querySelectorAll('p, .description, .about'))
            .slice(0, 10)
            .map(p => p.textContent.trim())
            .filter(text => text.length > 20);

        const content = `
Title: ${title}
Description: ${metaDescription}
Main headings: ${h1Elements.join(', ')}
Secondary headings: ${h2Elements.join(', ')}
Logo URL: ${logoUrl}
Main content: ${paragraphs.join(' ').substring(0, 1000)}
        `.trim();

        return content;
    }
}

// Initialize FormFiller
const formFiller = new FormFiller();