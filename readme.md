# Discord Gemini Bot Setup

This guide explains how to set up and run the Discord bot that interacts with the Google Gemini API.

## 1. Prerequisites

*   **Node.js and npm:** Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/). npm is included with Node.js.
*   **Discord Account:** You need a Discord account.
*   **Gemini API Key:** Obtain an API key for Gemini from [Google AI Studio](https://aistudio.google.com/app/apikey).

## 2. Create the Discord Bot Application

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Click on **"New Application"** and give it a name.
3.  Navigate to the **"Bot"** tab on the left sidebar.
4.  Click **"Add Bot"** and confirm.
5.  **Save the Token:** Under the bot's username, click **"Reset Token"** (or "View Token" if visible). Copy this token immediately and store it securely. **Do not share this token!**
6.  **Enable Intents:** Scroll down to the **"Privileged Gateway Intents"** section and enable the following:
    *   `PRESENCE INTENT` (Optional, enable if your bot needs presence information)
    *   `SERVER MEMBERS INTENT` (Optional, enable if your bot needs server member information)
    *   `MESSAGE CONTENT INTENT` (**Required** for the bot to read message content!)
7.  **Invite the Bot:**
    *   Go to the **"OAuth2"** tab, then select **"URL Generator"**.
    *   In the **"Scopes"** section, check the `bot` and `applications.commands` boxes.
    *   In the **"Bot Permissions"** section that appears below, select the necessary permissions for your bot (e.g., `Send Messages`, `Read Message History`, `View Channels`).
    *   Copy the generated URL at the bottom of the page.
    *   Paste the URL into your web browser and select the server where you want to add the bot. Authorize the bot.

## 3. Project Configuration

1.  **Clone or Download:** Get the bot's code onto your computer.
2.  **Navigate:** Open a terminal or command prompt and navigate into the project directory (e.g., `cd C:\Users\Edgar\Projects\Bot`).
3.  **Create `.env` file:** Create a file named `.env` in the root of the project directory. This file will store your secret keys.
4.  **Configure `.env`:** Add the following lines to the `.env` file, replacing the placeholder values with your actual credentials:

    ```dotenv
    # .env file configuration
    DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    BOT_NAME=YourBotUsername # The actual username of your bot on Discord
    ```

    *   Replace `YOUR_DISCORD_BOT_TOKEN_HERE` with the token you copied in step 2.5.
    *   Replace `YOUR_GEMINI_API_KEY_HERE` with the API key you obtained from Google AI Studio.
    *   Replace `YourBotUsername` with the exact username your bot has on Discord (case-sensitive, although the code uses lowercase for matching).

## 4. Installation and Running

1.  **Install Dependencies:** In your terminal (while in the project directory), run the following command to install the necessary libraries:
    ```bash
    npm install
    ```
2.  **Run the Bot:** Start the bot using the command:
    ```bash
    node bot.js
    ```

The bot should now connect to Discord and start responding in the channels it has access to, according to the logic defined in `bot.js`. Keep the terminal window open for the bot to remain online.