# Privacy Policy — Backlink Form Filler

Effective date: 2025-09-14

## Summary
Backlink Form Filler helps users analyze a website they provide and auto‑fill link submission forms. We do not sell or share personal data. Most data stays on the user’s device.

## Data We Process
- Website content: Public page text/metadata from a URL the user enters or opens, processed to generate an AI summary and form fields.
- Product profile data the user enters: name, website, tagline, description, category, features, notes, optional logo/screenshot.
- Optional Gemini API key: entered by the user to call Google’s Gemini service.

We do not intentionally collect personally identifiable information. Any data is provided or initiated by the user.

## How We Use Data
- To generate AI summaries and auto‑fill form fields on the current site at the user’s request.
- We do not use data for advertising, profiling, or resale.

## Single Purpose
This extension has a single, clearly defined purpose: **To automatically fill link submission forms using AI-powered website analysis.**

## Permission Justifications

### 1. Host Permission (`<all_urls>`)

**Why We Need Broad Host Permissions:**

This extension requires access to all websites (`<all_urls>`) to serve its core functionality. Here's why:

- **User Choice**: Users can analyze any website they choose. Different users work with different industries and domains (e-commerce, directories, SaaS platforms, local business listings, etc.)
- **URL Analysis**: When users provide a URL (e.g., "https://mycompany.example.com"), the extension fetches and analyzes that specific website to extract product information
- **No Predefined List**: We cannot predict or maintain a list of every domain users might want to analyze
- **Unpredictable Target Sites**: Users work with backlink submission forms on many different websites - we have no way to restrict access to a predefined set

**How the Permission is Used:**
1. User provides a URL in the extension's side panel
2. Extension fetches the website content to analyze it
3. Product information is extracted locally
4. User reviews the extracted data
5. User then fills a form on any website with the extracted information

**User Control:**
- The extension only accesses websites the user **explicitly requests**
- No automatic scanning or monitoring of websites
- No background data collection
- All website fetches happen only when the user initiates the analysis
- Users can see exactly which URL is being analyzed before it happens

**Important Security Notes:**
- This permission is necessary for the extension's functionality and is used responsibly
- Website content is processed locally; no data is sent externally without explicit user request
- The extension respects robots.txt and standard HTTP practices
- All accessed data is temporary and not stored permanently

### 2. activeTab Permission
This extension uses `activeTab` to:
- Access the currently active tab when the user interacts with the form-filling features
- Detect form fields that need to be filled
- Inject the auto-fill content only into the current tab the user is viewing

This ensures the extension only operates on the specific tab the user is actively working with.

### 3. scripting Permission
This extension uses `scripting` to:
- Inject a content script into web pages for intelligent form field detection
- Identify form fields (name, URL, tagline, description, features, comments, logo upload fields)
- Automatically fill form fields with extracted or AI-analyzed data
- Handle various HTML input types and rich text editors

The script only runs when the user explicitly requests the auto-fill functionality.

### 4. tabs Permission
This extension uses `tabs` to:
- Retrieve information about open browser tabs
- Fetch website content from URLs provided by the user
- Manage tab operations for the form-filling workflow

This is necessary for the extension to analyze websites and provide relevant data.

### 5. sidePanel Permission
This extension uses `sidePanel` to:
- Display the main interface for form filling in a side panel
- Provide a dedicated UI for users to interact with the extension's features
- Show extracted product information and form-filling options

This permission enables a better user experience by displaying the interface in a non-intrusive side panel.

### 6. storage Permission
This extension uses `storage` to:
- Store user settings (language, auto-fill toggle, logo upload toggle, debug mode)
- Save the user's optional Google Gemini API key
- Maintain saved product profiles and data locally
- Persist user preferences between browser sessions

All data is stored locally using `chrome.storage.local` and is never sent to our servers.

### 7. tabCapture Permission
This extension uses `tabCapture` to:
- Capture website content for AI-powered analysis at your request
- Extract product information (name, tagline, description, features, logos) from the pages you provide
- Process the captured content locally and optionally send it to Google Gemini API for intelligent analysis

Captured content is used only for the form-filling purpose and is not stored or used for any other purpose.

### 8. Remote Code
**This extension does NOT use remote code.** All code is bundled with the extension package at installation time. The extension:
- Does not download or execute code from the internet
- Does not have remote code execution capabilities
- Does not communicate with any servers except Google's Gemini API (only when explicitly requested by the user with their own API key)
- Is fully offline-capable except for optional AI analysis features

## Storage and Retention
- Product profiles, settings, and the optional API key are stored locally in the browser via `chrome.storage.local`.
- We do not operate developer‑controlled servers for this extension; we do not remotely store your data.
- Data remains until the user deletes it (e.g., via the extension UI or clearing browser storage).

## Sharing and Transfers
- We do not sell or transfer user data to third parties.
- When the user requests AI analysis, relevant website content may be sent to Google’s Gemini API using the user’s API key for processing. No other third parties receive data.

## Security
- The extension’s code ships with the package and does not execute remote code.
- Network requests are limited to user‑initiated fetches of public pages and calls to Google Gemini.

## User Controls
- Users can view, edit, export, or delete saved product profiles and remove the API key at any time.
- Clearing the extension’s local storage deletes locally stored data.

## Children’s Privacy
This extension is not directed to children under 13 and does not knowingly collect information from children.

## Changes to This Policy
We may update this policy. Changes will be posted at this URL with a new effective date.

## Contact
For privacy questions or requests, contact: aiinlinktutorial@gmail.com

## Data Usage Compliance Certification

We certify that our data usage practices comply with the Chrome Web Store Developer Program Policies:

✓ **Limited Use of Data**: We only use user data for the clearly stated purpose of analyzing websites and auto-filling link submission forms.

✓ **No Deceptive Practices**: All extension functionality is transparent and disclosed to users.

✓ **User Privacy Protection**:
- All data is stored locally on the user's device
- No personal data is sold or shared
- Users maintain full control over their data

✓ **Appropriate Permissions**: All requested permissions are necessary and directly related to the extension's stated functionality.

✓ **API Key Security**: Users provide their own Google Gemini API key; we never collect or store any API keys on servers.

✓ **No Hidden Functionality**: The extension performs only the functions disclosed in its description and privacy policy.


