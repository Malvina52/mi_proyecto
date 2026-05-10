# -*- coding: utf-8 -*-
import streamlit as st
from mi_proyecto.main import SistemaLegalER

st.set_page_config(page_title="Jurisprudencia Entre Ríos", layout="wide")
st.title("⚖️ Portal de Jurisprudencia de Entre Ríos")

# 1. Definir primero los selectores (Fuero según disponibilidad del portal [3])
tipo_fuero = st.sidebar.selectbox(
    "Seleccione el Fuero:",
    ["Civil y Comercial", "Amparos - STJ"]
)

# 2. El proceso solo se dispara al presionar el botón
if st.sidebar.button("Ejecutar Análisis"):
    with st.spinner("Iniciando secuencia de automatización (Ingreso + CAPTCHA + OCR)..."):
        try:
            # Se prepara la entrada de datos para la tripulación dinámica
            inputs = {'tipo_analisis': tipo_fuero}
            
            # Se instancia el sistema pasando los inputs al constructor (solución al error previo)
            # El sistema iniciará la secuencia de 6 pasos: Ingresar, Screenshot, OCR, etc. [1]
            resultado = SistemaLegalER(inputs=inputs).crew().kickoff(inputs=inputs)
            
            st.success("Análisis completado exitosamente.")
            
            # 3. Se renderiza el informe en el formato HTML oficial de las fuentes [4, 5]
            st.components.v1.html(str(resultado), height=1000, scrolling=True)
            
        except Exception as e:
            st.error(f"Error en el procesamiento: {e}")