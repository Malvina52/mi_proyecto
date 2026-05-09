import easyocr
import time
from playwright.sync_api import sync_playwright
from crewai.tools import tool

@tool("herramienta_busqueda_jurisprudencia_er")
def buscar_jurisprudencia_publica(termino: str) -> str:
    """
    Busca jurisprudencia en el portal de Entre Ríos. 
    Resuelve el captcha automáticamente mediante simulación de teclado humano 
    y extrae los resultados del sumario judicial.
    """
    # Inicializamos el motor de OCR (Naturaleza probabilística de la IA) [3]
    reader = easyocr.Reader(['en'])
    
    with sync_playwright() as p:
        # Iniciamos el navegador en modo visible para supervisión (HITL) [2]
        browser = p.chromium.launch(headless=False) 
        context = browser.new_context()
        page = context.new_page()
        
        # Navegamos a la URL específica del buscador de Entre Ríos
        page.goto("https://jur.jusentrerios.gov.ar/jur/?ai=jur||newpublica")
        
        # Bucle de reintento para gestionar fallos de lectura del OCR [4]
        for intento in range(5):
            try:
                # 1. PERCEPCIÓN: Esperamos a que el captcha sea visible
                captcha_element = page.locator("img[src*='mostrar_captchas_efs']").first
                captcha_element.wait_for(state="visible", timeout=30000)
                
                # 2. PROCESAMIENTO: Captura y lectura del texto
                captcha_bytes = captcha_element.screenshot()
                resultado_ocr = reader.readtext(captcha_bytes, detail=0)
                texto_captcha = ''.join(resultado_ocr).upper().replace(' ', '').strip()
                
                # 3. INTERACCIÓN FÍSICA: Asegurar que el sitio detecte el tipeo [5]
                campo_texto = page.locator("input[name='captcha_form']").first
                campo_texto.wait_for(state="visible", timeout=10000)
                
                # Hacemos clic y limpiamos el campo simulando teclado
                campo_texto.click()
                page.keyboard.press("Control+A")
                page.keyboard.press("Backspace")
                
                # Escribimos con delay de 200ms (Mimetismo humano) [5]
                page.keyboard.type(texto_captcha, delay=200)
                
                # Presionamos Enter físicamente para enviar el formulario
                page.keyboard.press("Enter")
                
                # 4. VALIDACIÓN: Si aparece el campo 'sumario', el captcha fue exitoso
                page.wait_for_selector("input[name='sumario']", timeout=15000)
                break  # Salimos del bucle al tener éxito
                
            except Exception:
                print(f"Intento {intento + 1} fallido. Reintentando...")
                continue

        # Verificación de seguridad de autonomía nivel 5 [1]
        if not page.locator("input[name='sumario']").is_visible():
            browser.close()
            return "Error: No se pudo saltar el captcha tras 3 intentos. HITL requerido para validar."

        # EJECUCIÓN DE BÚSQUEDA: Completamos el término y buscamos
        page.locator("input[name='sumario']").fill(termino)
        page.keyboard.press("Enter")
        
        # Esperamos que los resultados carguen antes de extraer el texto
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        
        # Extraemos el contenido para el análisis posterior de la tripulación [4]
        contenido = page.inner_text("body")
        browser.close()
        return contenido