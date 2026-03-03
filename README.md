# YouTube Studio Automation Script

A browser console script that automates two tedious YouTube Studio tasks: **bulk-publishing draft videos** and **alphabetically sorting playlists**.

---

## Features

- 📤 **Publish Drafts** — Iterates through all draft videos, sets "Made for Kids" status and visibility, then publishes them one by one
- 🔤 **Sort Playlist** — Sorts all videos in a playlist alphabetically (or by any custom sort key)

---

## Usage

1. Open [YouTube Studio](https://studio.youtube.com) in your browser
2. Navigate to the relevant page:
   - **Publish drafts** → go to your [Content](https://studio.youtube.com/channel/UC/videos) page
   - **Sort playlist** → open the specific playlist you want to sort
3. Open your browser's Developer Console (`F12` or `Cmd+Option+J` on Mac)
4. Edit the config section at the top of the script (see [Configuration](#configuration))
5. Paste the entire script into the console and press `Enter`

---

## Configuration

At the top of the script, edit the config block to suit your needs:

```js
const MODE = 'publish_drafts'; // 'publish_drafts' / 'sort_playlist'
const DEBUG_MODE = true;       // true / false — logs progress to the console

// Publish settings
const MADE_FOR_KIDS = false;   // true / false
const VISIBILITY = 'Public';   // 'Public' / 'Private' / 'Unlisted'

// Sort settings (default: alphabetical)
const SORTING_KEY = (one, other) => {
    return one.name.localeCompare(other.name, undefined, { numeric: true, sensitivity: 'base' });
};
```

### `MODE`
| Value | Description |
|---|---|
| `publish_drafts` | Publishes all draft videos on the current Content page |
| `sort_playlist` | Sorts all videos in the currently open playlist |

### `VISIBILITY`
| Value | Description |
|---|---|
| `Public` | Visible to everyone |
| `Unlisted` | Only accessible via direct link |
| `Private` | Only visible to you |

### `SORTING_KEY`
A standard JavaScript [comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description). The default sorts alphanumerically by video title. You can replace it with any custom logic, e.g. sort by date embedded in the title.

---

## Notes & Limitations

- The script operates on **whatever is currently visible on the page** — scroll down to load more videos if you want them included
- YouTube Studio's DOM selectors can change with UI updates; if the script breaks, the selectors near the top of the script may need updating
- There is a ~1 second delay between each action to avoid race conditions with YouTube's UI — do not interact with the page while the script is running
- `DEBUG_MODE = true` is recommended so you can follow progress in the console

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Script stops at "Video published" dialog | Make sure you're using the latest version of the script with the fixed `ytcp-video-share-dialog` selector |
| No drafts found | Ensure you're on the **Content** tab (`/videos`) and that draft videos are visible in the list |
| Playlist not sorting | Make sure you have the playlist open and fully loaded before running |
| Selector errors in console | YouTube may have updated their UI — inspect the relevant element and update the matching selector constant |

---

## Disclaimer

This script automates actions in your own YouTube Studio account via the browser console. It does not use any external API or store credentials. Use it responsibly and be aware that automating YouTube Studio interactions is outside YouTube's official supported workflows — use at your own risk.
