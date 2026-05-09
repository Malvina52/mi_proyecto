from mi_proyecto.crew import SistemaLegalER

def run():
    """
    Punto de entrada para el flujo de elevada autonomía (Nivel 5).
    """
    inputs = {
        'caso': 'Demanda por daños y perjuicios por accidente de tránsito en Paraná, Entre Ríos. El cliente fue embestido desde atrás en un semáforo.'
    }
    
    # Iniciamos la tripulación de forma autónoma
    SistemaLegalER().crew().kickoff(inputs=inputs)

if __name__ == "__main__":
    run()
