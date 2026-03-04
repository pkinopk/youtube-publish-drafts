# YouTube Studio Automation Script

A browser console script that automates a tedious YouTube Studio task: **bulk-publishing draft videos**.

## Features

- 📤 **Publish Drafts** — Iterates through all draft videos, sets "Made for Kids" status and visibility, then publishes them one by one

## Usage

1. Open [YouTube Studio](https://studio.youtube.com) in your browser
2. Navigate to your [Content](https://studio.youtube.com/channel/UC/videos) page
3. Open your browser's Developer Console (`F12` or `Cmd+Option+J` on Mac)
4. Edit the config section at the top of the script (see [Configuration](#configuration))
5. Paste the entire script into the console and press `Enter`

## Configuration

At the top of the script, edit the config block to suit your needs:

```js
const DEBUG_MODE = true;  // true / false — logs progress to the console

// Publish settings
const MADE_FOR_KIDS = false;  // true / false
const VISIBILITY = 'Public';  // 'Public' / 'Private' / 'Unlisted'
```

### `VISIBILITY`

| Value | Description |
|---|---|
| `Public` | Visible to everyone |
| `Unlisted` | Only accessible via direct link |
| `Private` | Only visible to you |

## Notes & Limitations

- The script operates on **whatever is currently visible on the page** — scroll down to load more videos if you want them included
- YouTube Studio's DOM selectors can change with UI updates; if the script breaks, the selectors near the top of the script may need updating
- There is a ~1 second delay between each action to avoid race conditions with YouTube's UI — do not interact with the page while the script is running
- `DEBUG_MODE = true` is recommended so you can follow progress in the console

## Troubleshooting

| Problem | Fix |
|---|---|
| Script stops at "Video published" dialog | Make sure you're using the latest version of the script with the fixed `ytcp-video-share-dialog` selector |
| No drafts found | Ensure you're on the **Content** tab (`/videos`) and that draft videos are visible in the list |
| Selector errors in console | YouTube may have updated their UI — inspect the relevant element and update the matching selector constant |

## Disclaimer

This script automates actions in your own YouTube Studio account via the browser console. It does not use any external API or store credentials. Use it responsibly and be aware that automating YouTube Studio interactions is outside YouTube's official supported workflows — use at your own risk.
