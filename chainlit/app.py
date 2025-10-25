from langchain_core.messages import HumanMessage

import atlas_assistant.agent
import atlas_assistant.settings
import chainlit
from atlas_assistant.agent import Agent
from chainlit import Message


@chainlit.on_chat_start
async def on_chat_start() -> None:
    settings = atlas_assistant.settings.get_settings()
    agent = atlas_assistant.agent.create_agent(settings)
    chainlit.user_session.set("agent", agent)


@chainlit.on_message
async def on_message(message: Message) -> None:
    agent: Agent | None = chainlit.user_session.get("agent")
    assert agent
    for update in agent.stream(
        {"messages": [HumanMessage(content=message.content)]},
        stream_mode="updates",
        config={"configurable": {"thread_id": "chainlit"}},
    ):
        for key, value in update.items():
            if messages := value.get("messages"):
                for msg in messages:
                    if msg.content:
                        _ = await Message(content=msg.content, author=key).send()
