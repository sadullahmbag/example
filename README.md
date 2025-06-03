# Kodivox

Kodivox is a simple web application for structuring qualitative interview transcripts. The app allows a researcher to register, upload transcripts, view parsed utterances and export the data in various formats.

This implementation runs entirely in the browser. User data and transcripts are stored in `localStorage` for convenience; no server or external dependencies are required.

## Usage

1. Open `index.html` in a modern web browser.
2. Register a new researcher account and log in.
3. From **My Interviews**, upload a transcript by pasting text or selecting a `.txt` file.
4. The transcript must use line prefixes `Interviewer:` and `Participant:`.
5. View the parsed transcript in a table and export it as CSV, JSON or plain text.
6. Log out to clear session data.

See the **Researcher Guidance** page for transcript formatting tips. The new **Interview Guide** section summarises best practices for conducting qualitative interviews.
