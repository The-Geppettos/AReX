import streamlit as st
import PyPDF2
from agent import agent_executor
from llm_utils import detect_scenes

def get_pdf_text(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as f:
        pdf_reader = PyPDF2.PdfReader(f)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

st.set_page_config(layout="wide")

st.title("Book Scene Summaries")

pdf_path = "C:\Users\clayd\AReX\nlp\pinocchio.pdf"

if 'scenes' not in st.session_state:
    st.session_state.scenes = []

if 'show_summaries' not in st.session_state:
    st.session_state.show_summaries = False

if not st.session_state.scenes:
    with st.spinner("Analyzing the book..."):
        full_text = get_pdf_text(pdf_path)
        scene_breaks = detect_scenes(full_text)
        scenes = []
        for i in range(len(scene_breaks)):
            start_page = scene_breaks[i]
            end_page = scene_breaks[i+1] - 1 if i + 1 < len(scene_breaks) else len(full_text.splitlines())
            scene_text = "\n".join(full_text.splitlines()[start_page-1:end_page])
            scenes.append(scene_text)
        st.session_state.scenes = scenes

if st.session_state.show_summaries:
    st.header("Scene Summaries")
    
    if st.button("Back to Book"):
        st.session_state.show_summaries = False
        st.experimental_rerun()

    for i, scene in enumerate(st.session_state.scenes):
        with st.container():
            col1, col2 = st.columns([1, 4])
            with col1:
                color_result = agent_executor.invoke({"input": f"Get the color for the following scene:\n\n{scene}"})
                color = color_result["output"]
                st.markdown(f"<div style='background-color:{color}; width:100px; height:100px; border-radius: 10px;'></div>", unsafe_allow_html=True)
            with col2:
                summary_result = agent_executor.invoke({"input": f"Summarize the following scene:\n\n{scene}"})
                summary = summary_result["output"]
                st.markdown(f"<h3>Scene {i+1}</h3><p>{summary}</p>", unsafe_allow_html=True)

else:
    st.header("The Adventures of Pinocchio")
    
    if st.button("View Scene Summaries"):
        st.session_state.show_summaries = True
        st.experimental_rerun()

    st.text(get_pdf_text(pdf_path))

