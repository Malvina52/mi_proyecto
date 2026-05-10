import easyocr
import time
import tempfile
import os
import cv2
import numpy as np
from playwright.sync_api import sync_playwright
from crewai.tools import tool


@tool("herramienta_busqueda_jurisprudencia_er")
def buscar_jurisprudencia_publica(termino: str) -> str:
    """
    Busca jurisprudencia en el portal de Entre Ríos.
    Resuelve el captcha automáticamente mediante filtros de imagen avanzados
    y simulación de teclado físico para asegurar el ingreso.
    """
    reader = easyocr.Reader(['en'])

    with sync_playwright() as p:
        # Navegador visible para supervisión humana (HITL)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            page.goto("https://jur.jusentrerios.gov.ar/jur/?ai=jur||newpublica")
            page.wait_for_load_state("networkidle")
            time.sleep(3)  # Espera a que el captcha termine de renderizar

            captcha_resuelto = False

            # Bucle de resiliencia: hasta 3 intentos para resolver el captcha
            for intento in range(3):
                try:
                    # Localizar y esperar el captcha
                    captcha_element = page.locator("img[src*='mostrar_captchas_efs']").first
                    captcha_element.wait_for(state="visible", timeout=30000)
                    time.sleep(2)  # Espera extra para que la imagen cargue completamente

                    # --- OPTIMIZACIÓN DE IMAGEN ---
                    captcha_bytes = captcha_element.screenshot()

                    nparr = np.frombuffer(captcha_bytes, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                    # Filtros para mejorar precisión del OCR
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
                    denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)

                    # Guardamos en archivo temporal para auditoría
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        ruta_captcha = tmp.name
                    cv2.imwrite(ruta_captcha, denoised)

                    # Lectura OCR
                    resultado_ocr = reader.readtext(ruta_captcha, detail=0)
                    os.unlink(ruta_captcha)  # Limpiamos el archivo temporal

                    texto_captcha = ''.join(resultado_ocr).upper().replace(' ', '').strip()
                    print(f"Captcha leído: '{texto_captcha}'")  # Para verificar en consola

                    # Validación: no intentar enviar si el OCR no leyó nada
                    if not texto_captcha:
                        raise ValueError("OCR no pudo leer el captcha.")

                    # --- ESCRITURA DEL CAPTCHA ---
                    campo_texto = page.locator("input[name='captcha_form']").first
                    campo_texto.wait_for(state="visible", timeout=10000)

                    # Clic para asegurar el foco en el campo
                    campo_texto.click()
                    time.sleep(0.5)  # Pausa antes de empezar a escribir

                    # Escritura carácter por carácter como un humano
                    page.keyboard.type(texto_captcha, delay=200)
                    time.sleep(0.5)  # Pausa antes de confirmar

                    # Presionar Enter para confirmar
                    page.keyboard.press("Enter")

                    # Verificamos si el captcha fue superado
                    page.wait_for_selector("input[name='sumario']", timeout=10000)

                    captcha_resuelto = True
                    break  # Éxito: salimos del bucle

                except Exception as e:
                    print(f"Intento {intento + 1} fallido: {e}. Reintentando...")
                    time.sleep(2)  # Pausa antes de reintentar
                    continue

            # Salvaguarda: si no se resolvió el captcha, requerir intervención humana
            if not captcha_resuelto or not page.locator("input[name='sumario']").is_visible():
                return "Error: CAPTCHA no superado tras 3 intentos. Requiere supervisión de editor calificado (HITL)."

            # --- EJECUCIÓN FINAL: búsqueda del término ---
            page.locator("input[name='sumario']").fill(termino)
            page.keyboard.press("Enter")

            page.wait_for_load_state("networkidle")

            contenido = page.inner_text("body")
            return contenido

        finally:
            # Garantizamos el cierre del navegador pase lo que pase
            browser.close()
