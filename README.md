# jot.

A local-first planner for coursework. Courses, assignments, exams and a to-do list, in a
desktop app that keeps your data in a file you control. You can sync it between computers
with git, Dropbox or any folder-syncing tool, or not sync it at all.

- **Calendar** with week and month views. Drag cards to reschedule.
- **Courses** with a highlighter colour and progress as you finish work.
- **To-do list**: drag an assignment onto it to link them. Checking off either one completes both.
- **Daily quote** from a built-in list, your own quotes, or Wikiquote.
- **Your data** is a single `jot.json`. Nothing is sent anywhere unless you set up syncing.

## Install

Download the latest build from [Releases](../../releases).

| System | Download |
|---|---|
| Windows | `.msi`, or `-setup.exe` |
| Debian, Ubuntu | `.deb` |
| Fedora, openSUSE | `.rpm` |
| Any Linux, including Arch | `.AppImage`: run `chmod +x jot_*.AppImage`, then open it |
| macOS | No builds yet. [Build it yourself](#development). |

The builds aren't code-signed. The first time you open it, Windows SmartScreen may warn you.
Click **More info**, then **Run anyway**.

## Syncing between computers

jot keeps a working copy inside the app. To use the same data on more than one computer
(or both systems of a dual-boot machine), point it at a folder in **Settings → Sync →
Choose folder**. jot saves `jot.json` there and reads changes from it.

### With git (recommended)

You get full history, and it works with any git host.

1. Create a **private** repository for your data. Keep it separate from this code repository.
2. Clone it on each computer, for example to `~/jot-data`.
3. Make sure git can push **without asking for anything**. jot runs git in the background,
   so it can't answer a password prompt. Use an SSH key loaded in your SSH agent, or a
   credential helper such as Git Credential Manager (included with Git for Windows).
   If `git push` works in a terminal without asking for anything, jot can push too.
4. On Windows, set your git identity once if you haven't already:
   `git config --global user.name "…"` and `git config --global user.email "…"`.
5. In jot, choose the clone in **Settings → Sync**. jot detects the remote and turns on git sync.

jot then commits and pushes about 30 seconds after you stop editing. It also pulls when it
starts, when you switch back to it, every 5 minutes, and once more before the window closes.
The status line at the bottom left tells you when it last synced.

If both computers changed things, jot merges them itself, record by record, keeping the
newer edit of each. Git never shows a conflict. Deleting something on one computer deletes
it on the other.

### With Dropbox, a shared drive, or a shared partition

Choose any folder that both computers can see. jot reads it on start and when you switch
back to it, and writes it a second after each change. The same record-by-record merge
applies.

### Dual boot: keep the clocks in agreement

Merging keeps the newer edit, so both systems need to agree on the time. Windows treats the
hardware clock as local time and Linux treats it as UTC, so right after booting one of them
can be off by your time zone offset. The usual fix is to make Windows use UTC. In an
administrator terminal, run:

```
reg add "HKLM\System\CurrentControlSet\Control\TimeZoneInformation" /v RealTimeIsUniversal /t REG_DWORD /d 1 /f
```

## Your data

- **Backups:** **Settings → Backups → Export backup** saves everything as JSON.
  **Import backup** merges a backup into what's there. Anything in the backup that you'd
  deleted comes back.
- **Delete all my data**, at the bottom of Settings, removes everything. If sync is on, the
  deletion reaches your other computers too. With git, older versions remain in the
  repository's history.
- **Wikiquote:** the quote of the day is the only network request jot makes on its own,
  and only if you choose Wikiquote as the quote source.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 24 or newer
- [Rust](https://rustup.rs), stable
- System libraries for [Tauri](https://v2.tauri.app/start/prerequisites/):

| System | Install |
|---|---|
| Arch, CachyOS | `sudo pacman -S --needed base-devel webkit2gtk-4.1 librsvg` |
| Debian, Ubuntu | `sudo apt install build-essential libwebkit2gtk-4.1-dev librsvg2-dev patchelf` |
| Fedora | `sudo dnf install webkit2gtk4.1-devel librsvg2-devel` and `sudo dnf group install development-tools` |
| Windows | [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) ("Desktop development with C++"). WebView2 already comes with Windows 10 and 11. |
| macOS | `xcode-select --install` |

### Commands

```sh
npm install
npm run tauri dev     # desktop app with hot reload
npm run dev           # browser only; folder and git sync are unavailable there
npm test              # TypeScript tests, including git sync against real repositories
npm run lint
npm run tauri build   # installers in src-tauri/target/release/bundle/
(cd src-tauri && cargo test)
```

On Wayland, `npm run tauri dev` shows a generic icon in the taskbar, because the window's
icon comes from an installed `.desktop` file. Installed builds show the real icon.

### Layout

| Path | What's there |
|---|---|
| `src/components/` | the interface |
| `src/store.ts` | app state (zustand), with an edit time on every record |
| `src/sync/merge.ts` | record-by-record merging |
| `src/sync/core.ts` | folder and git sync logic, independent of Tauri |
| `src/sync/engine.ts` | when to sync: timers, focus, window close |
| `src-tauri/src/storage.rs` | atomic file writes, and a git runner limited to the commands sync needs |

## Releasing

Releases are built by GitHub Actions when a version tag is pushed:

```sh
npm version minor            # or patch / major: bumps package.json and creates the tag
git push --follow-tags
```

[`.github/workflows/release.yml`](.github/workflows/release.yml) builds the Windows and
Linux installers and publishes them as a GitHub Release.
[`ci.yml`](.github/workflows/ci.yml) runs lint, tests and clippy on every push and pull
request.

## License

[MIT](LICENSE)
