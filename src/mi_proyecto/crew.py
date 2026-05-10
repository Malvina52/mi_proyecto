import os
from dotenv import load_dotenv
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from .tools.captcha_tool import buscar_jurisprudencia_publica

# Cargar variables .env
load_dotenv()

@CrewBase
class SistemaLegalER:
    """Sistema jurídico inteligente de Entre Ríos"""

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def __init__(self, inputs=None):
        # Guardamos los inputs manualmente para que estén disponibles
        self.inputs = inputs if inputs else {}
    
    def get_llm(self):
        return LLM(
            model="groq/llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0
        )

    @agent
    def analista(self) -> Agent:
        return Agent(
            config=self.agents_config['analista'],
            tools=[buscar_jurisprudencia_publica],
            llm=self.get_llm(),
            verbose=True, # Útil para debuguear la secuencia de 6 pasos del CAPTCHA [1]
            max_iter=3    # Permite reintentar si el OCR falla al leer 'captcha.png' [1, 2]
        )

    @agent
    def analista_amparos(self) -> Agent:
        return Agent(
            config=self.agents_config['analista_amparos_stj'],
            tools=[buscar_jurisprudencia_publica],
            llm=self.get_llm(),
            verbose=True
        )

    @agent
    def redactor(self) -> Agent:
        return Agent(
            config=self.agents_config['redactor'],
            llm=self.get_llm(),
            verbose=False
        )

    # Tareas para el fuero Civil y Comercial
    @task
    def analisis_civil(self) -> Task:
        return Task(
            config=self.tasks_config['analisis_caso'],
            agent=self.analista()
        )

    # Tareas para Amparos STJ
    @task
    def analisis_amparos(self) -> Task:
        return Task(
            config=self.tasks_config['analisis_amparos_stj'],
            agent=self.analista_amparos()
        )

    @task
    def redaccion(self) -> Task:
        return Task(
            config=self.tasks_config['redaccion'],
            agent=self.redactor()
        )

    @crew
    def crew(self) -> Crew:
        """Crea la tripulación de agentes de Entre Ríos de forma dinámica"""
        tipo = self.inputs.get('tipo_analisis', 'Civil y Comercial')
        
        # Selección de tareas según la elección del usuario
        if "Amparos" in tipo:
            lista_tareas = [self.analisis_amparos(), self.redaccion()]
        else:
            lista_tareas = [self.analisis_civil(), self.redaccion()]

        return Crew(
            agents=self.agents,
            tasks=lista_tareas,
            process=Process.sequential # Los agentes trabajan en orden secuencial
        )