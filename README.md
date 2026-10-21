# Darkened Theater Studios

The door. One page, served by GitHub Pages.

The passwords and replies in `index.html` are locked: each reply only opens with its own password. Don't edit them by hand; they're generated from the Door Passwords editor.

## Changing the passwords

Edit them in the Door Passwords editor and press **Push to the site**. Claude then runs
`node tools/build.js <the editor's passwords.json>`, which re-locks every reply into
`index.html` with fresh keys, and pushes it. The plain list never lives in this repo.
