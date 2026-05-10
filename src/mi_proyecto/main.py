import pytesseract
import os
from mi_proyecto.crew import SistemaLegalER

# Definimos la ruta apuntando a la carpeta que se ve en tu 'dir'
ruta_tesseract = os.path.join(os.getcwd(), "Tesseract-OCR", "tesseract.exe")
pytesseract.pytesseract.tesseract_cmd = ruta_tesseract

def run():
    inputs = {
        'tema': 'daños y perjuicios',
        'jurisdiccion': 'Entre Ríos'
    }
    # Ejecuta la tripulación
    result = SistemaLegalER().crew().kickoff(inputs=inputs)
    
    # Guarda el resultado en un archivo HTML automáticamente
    with open('resultado_jurisprudencia.html', 'w', encoding='utf-8') as f:
        f.write(str(result))
    
    print("Archivo 'resultado_jurisprudencia.html' generado con éxito.")

if __name__ == "__main__":
    run()
