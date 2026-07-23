# Dropcount

Dropcount is a static, client-side dashboard for exploring lifetime download totals across any public GitHub repository’s releases. It derives platform, architecture, file format, and asset kind from release filenames, then turns the public GitHub API response into version charts, breakdowns, a top-assets leaderboard, and a sortable release ledger.

There is no backend, build step, or embedded API key. Open `index.html` through any static file server and enter a repository as `owner/repo` or paste its GitHub URL.

## Run locally

Serve the project directory with any static server. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The app automatically loads the default repository on first launch. Bundled sample data remains available as an offline fallback if the live request fails because of a network or CORS problem.

## Project structure

- `app.js` and `styles.css` are lightweight entrypoints.
- `js/` separates configuration, parsing, derived analytics, GitHub access, rendering, and event wiring.
- `css/` groups base, dashboard, chart, table, dialog, and responsive styles.
- `assets/branding/` contains the light and dark icon artwork plus the transparent mascot.
- `assets/icons/`, `manifest.webmanifest`, and `sw.js` provide installable PWA support.

Every maintained source file is kept below 300 lines, and the app still runs directly as browser-native ES modules with no build step.

Run the dependency-free test suite with:

```sh
npm test
```

## Install as an app

Dropcount includes a web app manifest, maskable icons, Apple touch icon, and an offline app shell. In a supported browser, use **Install app** or **Add to Home Screen** after opening the deployed site.

The dashboard and bundled sample data remain available offline. Loading live repository data still requires a connection to GitHub.

## GitHub API limits and tokens

Unauthenticated GitHub REST API access is limited to 60 requests per hour per IP address. An authenticated request allows 5,000 requests per hour. Dropcount follows GitHub pagination to load repositories with more than 100 releases and displays the remaining and total request allowance after the final page.

Select **Add token** in the header to enter an optional fine-grained GitHub token. Public-repository read access is sufficient. The token is stored only in your browser under `dropcount_token`, is sent only in the `Authorization` header to `api.github.com`, and is never placed in a URL or logged.

Do not add a token to this repository or hard-code it in `app.js`.

## Data caveat

GitHub’s `download_count` is a lifetime cumulative count for each release asset. The API does not expose day-by-day history. Accordingly, every figure in Dropcount is a total-to-date, and the downloads-by-version chart is an adoption comparison rather than a time series.

Release tags are always accepted as GitHub provides them. SemVer embedded in tags such as `v1.2.3`, `app-v1.2.3-beta.2`, or `desktop-v2.0.0-rc.1` is used for version sorting and prerelease labels; unrecognized tag formats fall back to natural sorting and are never discarded.

Platform and architecture labels are inferred from filenames, so unusual naming schemes may appear as **Other** or **—**. The version chart shows the latest 16 visible releases for readability; the version scope and release ledger contain the complete fetched set.

## Deploy to GitHub Pages

### Option 1: deploy from the branch

This is the simplest option because Dropcount has no build step.

1. Commit the project files, including the `css/` and `js/` directories, to `main`.
2. Open the repository’s **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main`, choose `/ (root)`, and save.

All local assets use relative paths, so the app works correctly at `https://<user>.github.io/<repo>/`.

### Option 2: deploy with GitHub Actions

The included `.github/workflows/pages.yml` publishes this directory as a Pages artifact. In **Settings → Pages**, set the source to **GitHub Actions**, then push to `main`. The workflow will deploy automatically.

If the project is later moved to Vite or another bundler, set its public base to `./`, build before the upload step, and change the uploaded path to the generated `dist` directory.

## Privacy

Repository release data is fetched directly from the browser. Dropcount has no analytics service and no server-side component. The only persistent value it writes is the optional GitHub token in local storage.
