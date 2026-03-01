# Instagram Archive Viewer

A clean, easy-to-use web interface for viewing your exported Instagram chat history. This project takes the raw data provided by Instagram's export tool and turns it into a readable, searchable archive that looks exactly like the app.

---

## 📖 Description

**Instagram Archive Viewer** is a tool built to solve a specific problem: Instagram's data exports are often hard to read and navigate in their raw format. This project fixes that by providing a familiar interface that handles the heavy lifting of organizing messages.

The main issue this fixes is the "cluttered" look of raw message logs. In a normal export, it's hard to tell where one person's burst of messages ends and another begins. This viewer automatically groups consecutive messages from the same sender, adjusts bubble corners for a "tail" effect, and aligns everything to the correct side based on who is viewing the chat.

---

## 🎯 Purpose

The project serves three primary goals:

- **Readable History**: To provide a familiar, "app-like" experience for viewing archived conversations.
- **Smart Layout**: To solve the logic of message grouping, alignment, and avatar placement automatically.
- **Perspective Toggle**: To allow you to flip the view between both people in the chat instantly to see the conversation from either side.

---

## 🛠️ Built With

This project is built using modern web technologies to ensure it is fast and responsive:

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

To get the viewer running locally, follow these steps:

```
git clone https://github.com/AvesonThyBot/instagram-archive-viewer.git
cd instagram-archive-viewer
npm install
```

### 2. Import Your Chat

You can use the provided `install.sh` script to automatically move and format your export data into the viewer. The script accepts either absolute or local paths.

```
chmod +x install.sh
./install.sh {path/to/instagram/export/folder} {path/to/archive-viewer/folder}
```

### 3. Run the Viewer

```
npm run dev
```

---

## 🎥 Video Demo

_(Video demonstration coming soon — a placeholder will be added here shortly.)_

---

## 📚 Documentation

For information on how the `install.sh` script processes your data or how to manually format your JSON, please visit:

🔗 **[Link to Documentation – Placeholder]**

---

## ✨ Features & Planned Features

### Current Features

- **Message Grouping**: Automatically clusters messages from the same person so the UI isn't cluttered.
- **Perspective Toggle**: Instantly flip the UI between "User 1" and "User 2" views.
- **Dynamic Header**: The name and avatar in the top bar update based on who you are viewing the chat as.
- **Details Overlay**: A slide-up menu to see profile handles and a grid of shared media.

### Planned Features

- **Media Support**: Support for viewing high-resolution images and videos from the export.
- **Search Bar**: A way to quickly find specific words or phrases in long chats.
- **Theme Support**: Options to switch between Dark, Light, and custom colored modes.
