# Real-Time Scam Detector

This project is a real-time scam detector that uses a large language model (LLM) to detect scam images in posts on social media platforms. It includes a Chrome extension for monitoring and a FastAPI server for processing images.

## Features

- Detects scam images in real-time on Instagram, Facebook, and X (formerly Twitter).
- Uses OpenAI's GPT 4o mini model for classification.
- Displays alerts for detected scam images.
- Allows users to remove detected scam images from the database via a Streamlit web app.

## Installation Steps

1. **Clone the repository:**

    ```sh
    git clone https://github.com/prasannan-robots/big_brother
    cd big_brother
    ```

2. **Set up the FastAPI server:**

    - Create a virtual environment and activate it:

        ```sh
        python -m venv venv
        source venv/bin/activate  # On Windows use `venv\Scripts\activate`
        ```

    - Install the required dependencies:

        ```sh
        pip install -r requirements.txt
        ```

    - Create a `.env` file in the project root and add your OpenAI API key:

        ```env
        OPENAI_API_KEY=your_openai_api_key
        ```

    - Run the FastAPI server:

        ```sh
        uvicorn main:app --reload
        ```
3. **Run the Streamlit web app:**

    - Navigate back to the project root:

        ```sh
        cd ..
        ```

    - Run the Streamlit app:

        ```sh
        streamlit run streamlit_app.py
        ``

### Prerequisites

- Python 3.7+
- Browser
- Api Key

## Usage

1. **Activate the Chrome extension:**
    - Click on the extension icon in the Chrome toolbar.
    - Toggle the switch to enable monitoring.

2. **Monitor social media platforms:**
    - The extension will automatically detect scam images on Instagram, Facebook, and X.

3. **View and manage detected scam images:**
    - Open the Streamlit web app to view and manage detected scam images.
    - Use the "Remove" button to delete any detected scam images from the database.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.