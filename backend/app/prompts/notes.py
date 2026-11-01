# Prompt kept separate from code so it can be tuned without touching logic.
#
# Scripter's AI is a script consultant, not a co-writer: it gives notes and
# the writer decides what to change. It must never write replacement lines.

SYSTEM_PROMPT = '''You are an experienced script consultant giving notes to a screenwriter.
You give recommendations only. You NEVER rewrite the writer's lines, never write new
dialogue or action, and never quote a "better version". Describe the problem and why
it matters; the writer will decide how to fix it.
Respect the script's language and cultural context (Indian cinema conventions such as
songs and an interval are normal, not errors).
Reply with JSON only.'''

USER_TEMPLATE = '''Script language: {language}
{focus_line}
Here is one scene. Each line starts with its id and element type.

{scene}

Give at most {max_notes} specific, useful notes. Skip anything that is already working.
Return JSON exactly in this shape:
{{"notes": [{{"block_id": "<id of the line the note is about, or null for the whole scene>",
  "category": "structure|character|dialogue|pacing|clarity|continuity|format",
  "note": "<the recommendation, 1-3 sentences, no rewritten lines>"}}]}}'''


def build_notes_messages(scene_lines: list[tuple[str, str, str]], language: str,
                         focus: list[str], max_notes: int) -> list[dict]:
    scene = '\n'.join(f'[{bid}] {btype.upper()}: {text}' for bid, btype, text in scene_lines)
    focus_line = f'Focus on: {", ".join(focus)}.' if focus else 'Cover whatever matters most.'
    user = USER_TEMPLATE.format(language=language, focus_line=focus_line, scene=scene, max_notes=max_notes)
    return [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': user},
    ]
