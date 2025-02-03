import streamlit as st
import sqlite3

# Function to fetch scam data from the database
def fetch_scam_data():
    conn = sqlite3.connect('background.db')
    cursor = conn.cursor()
    cursor.execute('SELECT rowid, * FROM scamdata ORDER BY date DESC')
    scam_data = cursor.fetchall()
    conn.close()
    return scam_data

# Function to delete scam data from the database
def delete_scam_data(rowid):
    conn = sqlite3.connect('background.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM scamdata WHERE rowid = ?', (rowid,))
    conn.commit()
    conn.close()

# Display the scam data
st.title("Scam Data")

# Initial fetch
scam_data = fetch_scam_data()
scam_data_placeholder = st.empty()

def display_scam_data(data):
    scam_data_placeholder.empty()
    for row in data:
        rowid, date, image_base64, target = row
        st.write(f"Date: {date}")
        st.write(f"Target: {target}")
        st.image(image_base64)
        if st.button("Remove", key=rowid):
            delete_scam_data(rowid)
            st.rerun()
        st.write("---")

display_scam_data(scam_data)


