"""Review posts the detector flagged as scams.  Run:  streamlit run streamlit_app.py"""

import os
import sqlite3
from contextlib import closing

import streamlit as st
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("SCAM_DB_PATH", "background.db")
PASSWORD = os.getenv("DASHBOARD_PASSWORD", "")

st.set_page_config(page_title="Scam Detector · Flagged posts", page_icon="🛡️", layout="wide")

if PASSWORD and not st.session_state.get("authed"):
    st.title("🛡️ Scam Detector")
    entered = st.text_input("Dashboard password", type="password")
    if entered:
        if entered == PASSWORD:
            st.session_state.authed = True
            st.rerun()
        st.error("Wrong password")
    st.stop()


def fetch_scam_data():
    if not os.path.exists(DB_PATH):
        return []
    with closing(sqlite3.connect(DB_PATH)) as conn:
        columns = {row[1] for row in conn.execute("PRAGMA table_info(scamdata)")}
        reason = "reason" if "reason" in columns else "NULL"
        return conn.execute(f"SELECT rowid, date, image, target, {reason} FROM scamdata ORDER BY date DESC").fetchall()


def delete_scam_data(rowid):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("DELETE FROM scamdata WHERE rowid = ?", (rowid,))
        conn.commit()


st.title("🛡️ Flagged posts")
rows = fetch_scam_data()
targets = sorted({row[3] for row in rows if row[3]})

left, middle, right = st.columns(3)
left.metric("Flagged posts", len(rows))
middle.metric("Groups targeted", len(targets))
right.metric("Latest", rows[0][1] if rows else "—")

if not rows:
    st.info("Nothing flagged yet. Turn on monitoring in the extension and browse your feed.")
    st.stop()

chosen = st.multiselect("Filter by target group", targets)
visible = [row for row in rows if not chosen or row[3] in chosen]

for start in range(0, len(visible), 3):
    for column, (rowid, date, image, target, reason) in zip(st.columns(3), visible[start:start + 3]):
        with column.container(border=True):
            st.image(image, width="stretch")
            st.markdown(f"**Target:** {target or 'unknown'}  \n**Flagged:** {date}")
            if reason:
                st.caption(reason)
            if st.button("Remove", key=f"remove-{rowid}"):
                delete_scam_data(rowid)
                st.rerun()
