(() => {
    // -----------------------------------------------------------------
    // CONFIG (you're safe to edit this)
    // -----------------------------------------------------------------
    // ~ GLOBAL CONFIG
    // -----------------------------------------------------------------
    const MODE = 'publish_drafts'; // 'publish_drafts' / 'sort_playlist';
    const DEBUG_MODE = true; // true / false, enable for more context
    // -----------------------------------------------------------------
    // ~ PUBLISH CONFIG
    // -----------------------------------------------------------------
    const MADE_FOR_KIDS = false; // true / false;
    const VISIBILITY = 'Public'; // 'Public' / 'Private' / 'Unlisted'
    // -----------------------------------------------------------------
    // ~ SORT PLAYLIST CONFIG
    // -----------------------------------------------------------------
    const SORTING_KEY = (one, other) => {
        return one.name.localeCompare(other.name, undefined, {numeric: true, sensitivity: 'base'});
    };
    // END OF CONFIG (not safe to edit stuff below)
    // -----------------------------------------------------------------

    // ----------------------------------
    // COMMON  STUFF
    // ---------------------------------
    const TIMEOUT_STEP_MS = 20;
    const DEFAULT_ELEMENT_TIMEOUT_MS = 10000;
    function debugLog(...args) {
        if (!DEBUG_MODE) {
            return;
        }
        console.debug(...args);
    }
    const sleep = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms));

    async function waitForElement(selector, baseEl, timeoutMs) {
        if (timeoutMs === undefined) {
            timeoutMs = DEFAULT_ELEMENT_TIMEOUT_MS;
        }
        if (baseEl === undefined) {
            baseEl = document;
        }
        let timeout = timeoutMs;
        while (timeout > 0) {
            let element = baseEl.querySelector(selector);
            if (element !== null) {
                return element;
            }
            await sleep(TIMEOUT_STEP_MS);
            timeout -= TIMEOUT_STEP_MS;
        }
        debugLog(`could not find ${selector} inside`, baseEl);
        return null;
    }

    function click(element) {
        const event = document.createEvent('MouseEvents');
        event.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        element.dispatchEvent(event);
        element.click();
        debugLog(element, 'clicked');
    }

    // ----------------------------------
    // PUBLISH STUFF
    // ----------------------------------
    const VISIBILITY_PUBLISH_ORDER = {
        'Private': 0,
        'Unlisted': 1,
        'Public': 2,
    };

    // SELECTORS
    // ---------
    const VIDEO_ROW_SELECTOR = 'ytcp-video-row';
    const DRAFT_MODAL_SELECTOR = '.style-scope.ytcp-uploads-dialog';
    const DRAFT_BUTTON_SELECTOR = '.edit-draft-button';
    const MADE_FOR_KIDS_SELECTOR = '#made-for-kids-group';
    const RADIO_BUTTON_SELECTOR = 'tp-yt-paper-radio-button';
    const VISIBILITY_STEPPER_SELECTOR = '#step-badge-3';
    const VISIBILITY_PAPER_BUTTONS_SELECTOR = 'tp-yt-paper-radio-group';
    const SAVE_BUTTON_SELECTOR = '#done-button';
    const SUCCESS_ELEMENT_SELECTOR = 'ytcp-video-share-dialog'; // FIX: was 'ytcp-video-thumbnail-with-info'
    const DIALOG_SELECTOR = 'ytcp-video-share-dialog tp-yt-paper-dialog'; // FIX: simplified selector
    const DIALOG_CLOSE_BUTTON_SELECTOR = '#close-button, .ytcp-video-share-dialog tp-yt-iron-icon, button[aria-label="Close"]'; // FIX: broader close button targeting

    class SuccessDialog {
        constructor(raw) {
            this.raw = raw;
        }

        async closeDialogButton() {
            // FIX: Try multiple strategies to find the close button
            // 1. Try the close button by aria-label inside the dialog
            let btn = this.raw.querySelector('button[aria-label="Close"], #close-button');
            if (btn) return btn;

            // 2. Try tp-yt-iron-icon (original approach)
            btn = this.raw.querySelector('tp-yt-iron-icon');
            if (btn) return btn;

            // 3. Fall back to waiting for it
            return await waitForElement('tp-yt-iron-icon, #close-button, button[aria-label="Close"]', this.raw);
        }

        async close() {
            // FIX: Also try clicking the "Close" text button at the bottom of the dialog
            // as a fallback (visible in the screenshot as the grey "Close" button)
            const closeBtn = await this.closeDialogButton();
            if (closeBtn) {
                click(closeBtn);
            } else {
                // Last resort: find any button with text "Close" in the document
                const allButtons = [...document.querySelectorAll('button, tp-yt-paper-button')];
                const textClose = allButtons.find(b => b.textContent.trim().toLowerCase() === 'close');
                if (textClose) {
                    debugLog('closing via text-match fallback button');
                    click(textClose);
                } else {
                    debugLog('WARNING: could not find close button');
                }
            }
            await sleep(200); // FIX: increased from 50ms to give dialog time to dismiss
            debugLog('closed');
        }
    }

    class VisibilityModal {
        constructor(raw) {
            this.raw = raw;
        }

        async radioButtonGroup() {
            return await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, this.raw);
        }

        async visibilityRadioButton() {
            const group = await this.radioButtonGroup();
            const value = VISIBILITY_PUBLISH_ORDER[VISIBILITY];
            return [...group.querySelectorAll(RADIO_BUTTON_SELECTOR)][value];
        }

        async setVisibility() {
            click(await this.visibilityRadioButton());
            debugLog(`visibility set to ${VISIBILITY}`);
            await sleep(50);
        }

        async saveButton() {
            return await waitForElement(SAVE_BUTTON_SELECTOR, this.raw);
        }

        async isSaved() {
            // FIX: wait for the share dialog to appear, not ytcp-video-thumbnail-with-info
            const el = await waitForElement(SUCCESS_ELEMENT_SELECTOR, document, 15000);
            if (!el) throw new Error('Timed out waiting for publish success dialog');
            // Give the dialog a moment to fully render
            await sleep(500);
            return el;
        }

        async dialog() {
            // FIX: wait for and return the paper dialog inside the share dialog
            const shareDialog = await waitForElement(SUCCESS_ELEMENT_SELECTOR, document, 15000);
            if (!shareDialog) return null;
            const inner = shareDialog.querySelector('tp-yt-paper-dialog') || shareDialog;
            return inner;
        }

        async save() {
            click(await this.saveButton());
            debugLog('save clicked, waiting for success dialog...');
            await this.isSaved();
            debugLog('saved');
            const dialogElement = await this.dialog();
            const success = new SuccessDialog(dialogElement);
            return success;
        }
    }

    class DraftModal {
        constructor(raw) {
            this.raw = raw;
        }

        async madeForKidsToggle() {
            return await waitForElement(MADE_FOR_KIDS_SELECTOR, this.raw);
        }

        async madeForKidsPaperButton() {
            const nthChild = MADE_FOR_KIDS ? 1 : 2;
            return await waitForElement(`${RADIO_BUTTON_SELECTOR}:nth-child(${nthChild})`, this.raw);
        }

        async selectMadeForKids() {
            click(await this.madeForKidsPaperButton());
            await sleep(50);
            debugLog(`"Made for kids" set as ${MADE_FOR_KIDS}`);
        }

        async visibilityStepper() {
            return await waitForElement(VISIBILITY_STEPPER_SELECTOR, this.raw);
        }

        async goToVisibility() {
            debugLog('going to Visibility');
            await sleep(50);
            click(await this.visibilityStepper());
            const visibility = new VisibilityModal(this.raw);
            await sleep(50);
            await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, visibility.raw);
            return visibility;
        }
    }

    class VideoRow {
        constructor(raw) {
            this.raw = raw;
        }

        get editDraftButton() {
            return waitForElement(DRAFT_BUTTON_SELECTOR, this.raw, 20);
        }

        async openDraft() {
            debugLog('focusing draft button');
            click(await this.editDraftButton);
            return new DraftModal(await waitForElement(DRAFT_MODAL_SELECTOR));
        }
    }


    function allVideos() {
        return [...document.querySelectorAll(VIDEO_ROW_SELECTOR)].map((el) => new VideoRow(el));
    }

    async function editableVideos() {
        let editable = [];
        for (let video of allVideos()) {
            if ((await video.editDraftButton) !== null) {
                editable = [...editable, video];
            }
        }
        return editable;
    }

    async function publishDrafts() {
        const videos = await editableVideos();
        debugLog(`found ${videos.length} videos`);
        debugLog('starting in 1000ms');
        await sleep(1000);
        for (let video of videos) {
            const draft = await video.openDraft();
            debugLog({ draft });
            await draft.selectMadeForKids();
            const visibility = await draft.goToVisibility();
            await visibility.setVisibility();
            const dialog = await visibility.save();
            await dialog.close();
            await sleep(100);
        }
    }

    // ----------------------------------
    // SORTING STUFF
    // ----------------------------------
    const SORTING_MENU_BUTTON_SELECTOR = 'button';
    const SORTING_ITEM_MENU_SELECTOR = 'tp-yt-paper-listbox#items';
    const SORTING_ITEM_MENU_ITEM_SELECTOR = 'ytd-menu-service-item-renderer';
    const MOVE_TO_TOP_INDEX = 4;
    const MOVE_TO_BOTTOM_INDEX = 5;

    class SortingDialog {
        constructor(raw) {
            this.raw = raw;
        }

        async anyMenuItem() {
            const item = await waitForElement(SORTING_ITEM_MENU_ITEM_SELECTOR, this.raw);
            if (item === null) {
                throw new Error("could not locate any menu item");
            }
            return item;
        }

        menuItems() {
            return [...this.raw.querySelectorAll(SORTING_ITEM_MENU_ITEM_SELECTOR)];
        }

        async moveToTop() {
            click(this.menuItems()[MOVE_TO_TOP_INDEX]);
        }

        async moveToBottom() {
            click(this.menuItems()[MOVE_TO_BOTTOM_INDEX]);
        }
    }

    class PlaylistVideo {
        constructor(raw) {
            this.raw = raw;
        }
        get name() {
            return this.raw.querySelector('#video-title').textContent;
        }
        async dialog() {
            return this.raw.querySelector(SORTING_MENU_BUTTON_SELECTOR);
        }

        async openDialog() {
            click(await this.dialog());
            const dialog = new SortingDialog(await waitForElement(SORTING_ITEM_MENU_SELECTOR));
            await dialog.anyMenuItem();
            return dialog;
        }
    }

    async function playlistVideos() {
        return [...document.querySelectorAll('ytd-playlist-video-renderer')]
            .map((el) => new PlaylistVideo(el));
    }

    async function sortPlaylist() {
        debugLog('sorting playlist');
        const videos = await playlistVideos();
        debugLog(`found ${videos.length} videos`);
        videos.sort(SORTING_KEY);
        const videoNames = videos.map((v) => v.name);

        let index = 1;
        for (let name of videoNames) {
            debugLog({ index, name });
            const video = videos.find((v) => v.name === name);
            const dialog = await video.openDialog();
            await dialog.moveToBottom();
            await sleep(1000);
            index += 1;
        }
    }

    // ----------------------------------
    // ENTRY POINT
    // ----------------------------------
    ({
        'publish_drafts': publishDrafts,
        'sort_playlist': sortPlaylist,
    })[MODE]();

})();
