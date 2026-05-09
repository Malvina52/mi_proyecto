from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from .tools.captcha_tool import buscar_jurisprudencia_publica

@CrewBase
class SistemaLegalER():
    """Sistema jurídico inteligente de Entre Ríos"""

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def get_llm(self):
        return LLM(
            provider="openrouter",
            model="meta-llama/llama-3.3-70b-instruct",
            temperature=0.2
        )

    @agent
    def analista(self) -> Agent:
        return Agent(
            config=self.agents_config['analista'],
            tools=[buscar_jurisprudencia_publica],
            llm=self.get_llm(),
            verbose=True
        )

    @agent
    def estratega(self) -> Agent:
        return Agent(
            config=self.agents_config['estratega'],
            llm=self.get_llm(),
            verbose=True,
            allow_delegation=True
        )

    @agent
    def redactor(self) -> Agent:
        return Agent(
            config=self.agents_config['redactor'],
            llm=self.get_llm(),
            verbose=True
        )

    @task
    def analisis_caso(self) -> Task:
        return Task(
            config=self.tasks_config['analisis_caso'],
            agent=self.analista()
        )

    @task
    def estrategia(self) -> Task:
        return Task(
            config=self.tasks_config['estrategia'],
            agent=self.estratega()
        )

    @task
    def redaccion(self) -> Task:
        return Task(
            config=self.tasks_config['redaccion'],
            agent=self.redactor()
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True
        )
