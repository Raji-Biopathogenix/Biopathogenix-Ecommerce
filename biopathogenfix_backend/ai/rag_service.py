from .answer import answer_question


def chat_reply(user_text: str, history=None) -> str:
    history = history or []
    reply, _docs = answer_question(user_text, history)
    return reply
