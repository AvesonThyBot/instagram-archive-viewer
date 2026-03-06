# Instagram Archives Viewer

A clean, easy-to-use web interface for viewing exported Instagram chat history. This project takes raw JSON data and turns it into a readable, searchable archive that looks and feels like the native app.

---

## 📖 Description

**Instagram Archive Viewer** was created to solve a critical data-loss issue. Instagram includes a "Delete Chat" feature that permanently wipes conversation history for both parties; additionally, many users report bugs where entire chat histories vanish without warning or user action.

By using a JSON data export from the recipient's side, you can restore and view messages in a professional layout that mirrors the original experience.

Even if your data hasn't been deleted, this tool serves as a **powerful alternative to Instagram's native search engine**. It provides a much faster, more precise way to navigate thousands of messages with full local privacy. The viewer automatically groups consecutive messages, adjusts bubble corners for a "tail" effect, and aligns text based on your chosen perspective.

---

## 🎯 Purpose

The project serves three primary goals:

- **Data Redundancy**: Protect against accidental deletions or platform bugs by viewing external backups in a native-feeling UI.
- **Superior Search**: A high-performance search engine that far outclasses the limited and often slow search functionality within the Instagram app.
- **Full Privacy**: Your data never leaves your machine. The viewer runs locally, processing your JSON export without uploading it to any server.

---

## 🛠️ Built With

- **React**: For the core interface and state management.
- **Tailwind CSS**: For the styling and mobile-responsive layout.
- **Lucide React**: For the iconography.

---

## 📥 How to Get Your Data

To use this viewer, you need to request your data from Instagram:

1. Go to **Instagram Settings** > **Your Activity** > **Download Your Information**.
2. Select **Some of your information**.
3. Choose **Messages** from the list.
4. Set the format to **JSON** (HTML will not work with this viewer).
5. Select your date range and click **Request Download**.
6. Once the email arrives, download and unzip the folder.

---

## 🚀 How to Use It

### 1. Installation & Setup

To get the viewer running locally:

```
git clone https://github.com/AvesonThyBot/instagram-archive-viewer.git
cd instagram-archive-viewer
npm install
```

### 2. Import Your Chat

You can use the `install.sh` script to automatically move and format your export data. This script accepts both absolute and relative paths.

```
chmod +x install.sh
./install.sh {path/to/instagram/export/folder} {path/to/archive-viewer/folder}
```

### 3. Run the Viewer

```
npm run dev
```

---

## ✨ Features & Planned Features

### Current Features

- **Perspective Toggle**: Instantly flip the UI between "User 1" and "User 2" views.
- **Privacy Focused**: Processes data locally; no cloud uploads required.
- **Details Overlay**: A slide-up menu to see settings and shared media etc.

### Planned Features

- **Power Search**: Advanced filtering by date, keyword, and media type.
- **Media Support**: Integration for viewing high-resolution images and videos from the export folder.
- **Theme Support**: Options to switch between Dark, Light, and custom colored modes.
