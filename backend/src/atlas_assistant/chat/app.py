import json

import chainlit as cl
import plotly.graph_objects as go

import atlas_assistant.settings
from atlas_assistant.agent import create_graph


@cl.on_chat_start
async def start():
    """Initialize the agent when chat starts"""
    settings = atlas_assistant.settings.get_settings()
    graph = await create_graph(settings)
    cl.user_session.set("graph", graph)
    cl.user_session.set("thread_id", "default_thread")
    await cl.Message(
        content="""Hello! Ask me about climate adaptation data from the Adaptation Atlas.
        Examples:
        - Make a plot about percent change in cattle dry matter intake over all available countries
        - Give me a plot with information about crop suitability in Kenya
        - Do you have deforestation data? -- Follow up with: can you analyze this in Mozambique?
        """
    ).send()


@cl.on_message
async def main(message: cl.Message):
    """Handle incoming messages"""
    graph = cl.user_session.get("graph")
    thread_id = cl.user_session.get("thread_id")

    config = {"configurable": {"thread_id": thread_id}}

    # Create a message to update with streaming content
    msg = cl.Message(content="")

    # Stream agent updates
    async for update in graph.astream(
        {"messages": [("user", message.content)]}, config=config, stream_mode="updates"
    ):
        for node, values in update.items():
            # Show raw state updates for each tool
            if values:  # Only show if there are actual updates
                msg_content = "\n".join(
                    [msg.content for msg in values["messages"] if msg.content]
                )
                values.pop("messages")
                update_json = json.dumps(values, indent=2, default=str)

                # Truncate for preview if too long
                if len(update_json) > 500:
                    msg_data = (
                        update_json[:500]
                        + "\n... (truncated, "
                        + str(len(update_json))
                        + " chars total)"
                    )
                else:
                    msg_data = update_json

                final = f"Update from **{node}**"
                send = False
                if msg_content:
                    send = True
                    final += f"\n**msg:** {msg_content}"
                if msg_data != "{}":
                    send = True
                    final += f"\n```json\n{msg_data}\n```"

                if send:
                    await cl.Message(
                        content=final,
                        author="System",
                    ).send()

            # Handle SQL query
            if "chart_query" in values and values["chart_query"]:
                await cl.Message(
                    content=f"**SQL Query:**\n```sql\n{values['chart_query']}\n```",
                    author="System",
                ).send()

            # Handle Python code
            if "python_code" in values and values["python_code"]:
                await cl.Message(
                    content=f"**Python Code:**\n```python\n{values['python_code']}\n```",
                    author="System",
                ).send()

            # Handle charts
            if "chart" in values and values["chart"]:
                chart_data = values["chart"]
                fig = go.Figure(chart_data)

                # Send chart as a separate element
                elements = [cl.Plotly(name="chart", figure=fig, display="inline")]
                msg.elements = elements
                await msg.update()

            # Handle text messages
            if "messages" in values:
                last_msg = values["messages"][-1]
                if hasattr(last_msg, "content") and last_msg.content:
                    msg.content = last_msg.content
                    await msg.update()

    # Final send
    await msg.send()
